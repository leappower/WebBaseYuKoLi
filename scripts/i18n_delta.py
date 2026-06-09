#!/usr/bin/env python3
"""
i18n-delta: 通用多语言增量翻译框架
=====================================
纯本地脚本，不需要任何 API key 即可运行 diff 分析。
翻译功能需要配置 API 后端（OpenAI 兼容接口）。

用法:
  python i18n_delta.py translate --new ./0528/ --baseline ./0525/ --config config.yml
  python i18n_delta.py translate --new ./0528/ --config config.yml     # 全量（无 baseline）
  python i18n_delta.py check    --dir ./0528/ --config config.yml      # 质量检查
"""

import argparse
import json
import os
import re
import sys
import time
import io
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple, Any

# ── 可选依赖 ────────────────────────────────────────────
try:
    import yaml
except ImportError:
    print("⚠ 缺少 pyyaml，请执行: pip install pyyaml")
    sys.exit(1)

try:
    import requests
except ImportError:
    print("⚠ 缺少 requests，请执行: pip install requests")
    sys.exit(1)

# ── 终端编码修正 ────────────────────────────────────────
if sys.platform == 'win32' and sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

# ── CJK 检测（用于质量检查）────────────────────────────
CJK_PAT = re.compile(r'[\u4e00-\u9fff]')


# ╔═══════════════════════════════════════════════════════╗
# ║                   Config Loader                       ║
# ╚═══════════════════════════════════════════════════════╝

class I18nConfig:
    """加载并校验 config.yml"""

    def __init__(self, config_path: str):
        with open(config_path, 'r', encoding='utf-8') as f:
            raw = yaml.safe_load(f)
        self._validate(raw)
        self.raw = raw
        self.source_lang: str = raw['source_lang']
        self.target_langs: List[str] = raw['target_langs']
        self.file_groups: List[dict] = raw['file_groups']
        self.api: dict = raw['api']
        self.prompts: dict = raw['prompts']
        self.lang_names: dict = raw.get('lang_names', {})
        self.preserve: dict = raw.get('preserve', {})
        self.project: dict = raw.get('project', {})
        self._api_key: Optional[str] = None

    def _validate(self, raw):
        required = ['source_lang', 'target_langs', 'file_groups', 'api']
        for k in required:
            assert k in raw, f"config.yml 缺少必需字段: {k}"
        assert raw['target_langs'], "target_langs 不能为空"
        assert raw['file_groups'], "file_groups 不能为空"

    def api_key(self) -> str:
        if self._api_key is None:
            env = self.api.get('api_key_env', '')
            self._api_key = os.environ.get(env, '') if env else ''
        return self._api_key

    def api_url(self) -> str:
        return self.api.get('base_url', '') + '/chat/completions'

    def model(self) -> str:
        return self.api.get('model', '')

    @staticmethod
    def load(path: str) -> 'I18nConfig':
        return I18nConfig(path)


# ╔═══════════════════════════════════════════════════════╗
# ║                   Diff Engine                         ║
# ╚═══════════════════════════════════════════════════════╝

class DiffResult:
    """一份源文件的 diff 结果"""
    def __init__(self, added: List[str], removed: List[str],
                 modified: List[str], unchanged: Set[str]):
        self.added = added
        self.removed = removed
        self.modified = modified
        self.unchanged = unchanged
        self.delta_keys = added + modified

    @property
    def delta_count(self) -> int:
        return len(self.delta_keys)

    def summary(self) -> str:
        return (f"+{len(self.added)} -{len(self.removed)} "
                f"~{len(self.modified)} ={len(self.unchanged)} "
                f"→ delta={self.delta_count}")


def diff_json(new_data: dict, old_data: dict) -> DiffResult:
    """对比两个 dict，计算 added / removed / modified / unchanged"""
    nk, ok = set(new_data.keys()), set(old_data.keys())
    added = sorted(nk - ok)
    removed = ok - nk
    modified = sorted({k for k in nk & ok if new_data[k] != old_data[k]})
    unchanged = (nk & ok) - set(modified)
    return DiffResult(added, list(removed), modified, unchanged)


# ╔═══════════════════════════════════════════════════════╗
# ║                   Translation API                     ║
# ╚═══════════════════════════════════════════════════════╝

class Translator:
    """并发批量翻译，支持自动重试"""

    def __init__(self, config: I18nConfig):
        self.cfg = config
        self.api_url = config.api_url()
        self.model = config.model()
        self.api_key = config.api_key()
        self.timeout = config.api.get('timeout', 180)
        self.max_retries = config.api.get('max_retries', 5)
        self.temperature = config.api.get('temperature', 0.1)
        self.batch_size = config.api.get('batch_size', 30)
        self.concurrency = config.api.get('concurrency', 6)

    def _call_api(self, system_prompt: str, batch: dict, label: str) -> dict:
        """单次 API 调用，带重试"""
        payload = json.dumps(batch, ensure_ascii=False)
        for attempt in range(self.max_retries):
            t0 = time.time()
            try:
                resp = requests.post(
                    self.api_url,
                    headers={
                        'Content-Type': 'application/json',
                        'Authorization': f'Bearer {self.api_key}'
                    },
                    json={
                        'model': self.model,
                        'messages': [
                            {'role': 'system', 'content': system_prompt},
                            {'role': 'user', 'content': payload}
                        ],
                        'max_tokens': 16384,
                        'temperature': self.temperature
                    },
                    timeout=self.timeout
                )
                if resp.status_code != 200:
                    time.sleep(5)
                    continue
                raw = resp.json()['choices'][0]['message']['content'].strip()
                raw = (raw.strip()
                           .removeprefix('```json')
                           .removeprefix('```')
                           .removesuffix('```')
                           .strip())
                result = json.loads(raw)
                missing = set(batch.keys()) - set(result.keys())
                if missing:
                    time.sleep(5)
                    continue
                print(f'  OK {label} ({time.time()-t0:.0f}s)')
                return result
            except Exception:
                time.sleep(min(10 * (attempt + 1), 30))
        print(f'  FAIL {label}')
        return {}

    def translate_batch(self, system_prompt: str,
                        batch: dict, label: str) -> dict:
        return self._call_api(system_prompt, batch, label)

    def translate_delta(self, source_data: dict, delta_keys: List[str],
                        system_prompt: str, label_prefix: str) -> dict:
        """批量并发翻译 delta keys"""
        need = {k: source_data[k] for k in delta_keys if k in source_data}
        if not need:
            return {}
        keys = sorted(need.keys())
        bs = min(self.batch_size, max(1, len(keys)))
        batches = []
        for i in range(0, len(keys), bs):
            bk = keys[i:i + bs]
            batches.append((i // bs, {k: need[k] for k in bk}))

        n = len(batches)
        print(f'  [{label_prefix}] 翻译 {len(keys)} 条 ({n} 批)')

        results = {}
        with ThreadPoolExecutor(max_workers=self.concurrency) as ex:
            fmap = {}
            for bid, bd in batches:
                lbl = f'{label_prefix}#{bid + 1}/{n}'
                fmap[ex.submit(self._call_api, system_prompt,
                               dict(bd), lbl)] = bid
            for fut in as_completed(fmap):
                try:
                    r = fut.result(timeout=self.timeout + 30)
                    if r:
                        results[fmap[fut]] = r
                except Exception:
                    pass
        return results


# ╔═══════════════════════════════════════════════════════╗
# ║                   Prompt Builder                      ║
# ╚═══════════════════════════════════════════════════════╝

def build_system_prompt(config: I18nConfig, prompt_type: str,
                        target_lang: str) -> str:
    """根据配置构建系统提示词"""
    prompt_cfg = config.prompts.get(prompt_type, config.prompts.get('ui', {}))
    lang_info = config.lang_names.get(target_lang, {
        'source': config.source_lang,
        'target': target_lang
    })
    project_name = config.project.get('name', 'the project')

    expert = prompt_cfg.get('expert', 'professional translator for {project_name}')
    expert = expert.replace('{project_name}', project_name)

    instruction_tpl = prompt_cfg.get('instruction_template',
                                     'Translate {source_lang_name} to {target_lang_name}')
    instruction = instruction_tpl.replace('{source_lang_name}', str(lang_info.get('source', '')))
    instruction = instruction.replace('{target_lang_name}', str(lang_info.get('target', '')))

    rules = prompt_cfg.get('rules', [])
    rules_text = '\n'.join(f'{i + 1}. {r}' for i, r in enumerate(rules))

    # 保留规则
    preserve_lines = []
    brands = config.preserve.get('brands', [])
    certs = config.preserve.get('certifications', [])
    if brands:
        preserve_lines.append(f"Do NOT translate: brands — {', '.join(brands)}")
    if certs:
        preserve_lines.append(f"Do NOT translate: certifications — {', '.join(certs)}")
    placeholders = config.preserve.get('placeholders', [])
    if placeholders:
        preserve_lines.append(f"Do NOT translate: placeholders matching "
                              f"{' / '.join(placeholders)}")
    preserve_text = '\n'.join(preserve_lines)

    return f"""You are a {expert}. {instruction}

Rules:
{rules_text}

Output pure JSON, keep keys unchanged, translate all values.
{preserve_text}
No markdown."""


# ╔═══════════════════════════════════════════════════════╗
# ║                   File  I/O                           ║
# ╚═══════════════════════════════════════════════════════╝

def load_json(path: str) -> dict:
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(path: str, data: dict, key_order: List[str]):
    ordered = {k: data.get(k, '') for k in key_order}
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else '.', exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(ordered, f, ensure_ascii=False, indent=2)


def find_source_file(directory: str, lang: str, suffix: str) -> Optional[str]:
    """在目录中查找源文件"""
    filename = f"{lang}{suffix}"
    path = os.path.join(directory, filename)
    return path if os.path.exists(path) else None


# ╔═══════════════════════════════════════════════════════╗
# ║                   Main Logic                          ║
# ╚═══════════════════════════════════════════════════════╝

def check_quality(config: I18nConfig, directory: str):
    """检查所有输出文件的中文残留"""
    print(f"\n{'='*60}")
    print(f"质量检查: {directory}")
    print(f"{'='*60}")

    for lg in config.file_groups:
        suffix = lg['output_pattern'].replace('{lang}', '')
        for lang in config.target_langs:
            path = find_source_file(directory, lang, suffix)
            if not path:
                print(f"  [{lang}] {lg['name']}: 文件不存在")
                continue
            data = load_json(path)
            cn_count = sum(1 for v in data.values()
                          if isinstance(v, str) and CJK_PAT.search(v))
            skip_keys = set(config.preserve.get('skip_keys', []))
            real_residual = 0
            for k, v in data.items():
                if k in skip_keys:
                    continue
                if isinstance(v, str) and CJK_PAT.search(v):
                    real_residual += 1

            status = "✅" if real_residual == 0 else f"⚠ {real_residual}条"
            print(f"  [{lang}] {lg['name']}: {len(data)}键 | 中文残留 {status}")


def process_group(config: I18nConfig, new_dir: str, baseline_dir: Optional[str],
                  group: dict, translator: Translator) -> dict:
    """
    处理一个 file_group:
    1. 对比新旧源文件 → 计算 delta
    2. 遍历每个目标语言
    3. 继承旧翻译 + 翻译 delta + 输出
    返回: {lang: {file_path: key_count}}
    """
    name = group['name']
    src_suffix = group['source_suffix']
    out_pattern = group['output_pattern']
    prompt_type = group['prompt_type']
    results = {}

    # 读新源文件
    new_src_path = find_source_file(new_dir, config.source_lang, src_suffix)
    if not new_src_path:
        print(f"⚠ [{name}] 找不到源文件: {config.source_lang}{src_suffix} in {new_dir}")
        return results
    new_src = load_json(new_src_path)

    # 计算 delta（如果有 baseline）
    old_src = None
    delta = None
    if baseline_dir:
        old_src_path = find_source_file(baseline_dir, config.source_lang, src_suffix)
        if old_src_path:
            old_src = load_json(old_src_path)
            delta = diff_json(new_src, old_src)
            print(f"\n[{name}] 增量: {delta.summary()}")
        else:
            print(f"\n[{name}] 无旧源文件，全量翻译 {len(new_src)} 键")
    else:
        print(f"\n[{name}] 无 baseline，全量翻译 {len(new_src)} 键")

    # 逐个语言处理
    for lang in config.target_langs:
        out_path = os.path.join(new_dir,
                                out_pattern.replace('{lang}', lang.lower()))
        old_path = (os.path.join(baseline_dir, out_pattern.replace('{lang}', lang.lower()))
                    if baseline_dir else None)
        old_exists = old_path and os.path.exists(old_path)

        # 构建提示词
        sp = build_system_prompt(config, prompt_type, lang)

        if delta and old_exists:
            # ── 增量模式 ──
            old_data = load_json(old_path)
            skip_keys = set(config.preserve.get('skip_keys', []))
            # 继承未变 key
            new_data = {k: old_data[k] for k in delta.unchanged
                       if k in old_data}
            # 修改 key 先继承旧值（后续覆盖）
            for k in delta.modified:
                if k in old_data:
                    new_data[k] = old_data[k]
            # 翻译 delta
            if delta.delta_keys:
                trans = translator.translate_delta(
                    new_src, delta.delta_keys, sp, f'{lang}/{name}')
                for _, batch_result in trans.items():
                    for k, v in batch_result.items():
                        if isinstance(v, str) and k not in skip_keys:
                            new_data[k] = v
            # 保底：缺失的 key 用源语言填充
            for k in new_src:
                if k not in new_data:
                    new_data[k] = new_src[k]

        elif old_exists:
            # ── 全量继承（无 delta 但有旧文件）──
            old_data = load_json(old_path)
            new_data = {}
            for k in new_src:
                if k in old_data:
                    new_data[k] = old_data[k]
                else:
                    new_data[k] = new_src[k]
            print(f"  [{lang}] {name}: 全量继承 {len(new_src)} 键 (无 delta)")
        else:
            # ── 全量翻译（无旧文件）──
            if not translator.api_key:
                print(f"  [{lang}] {name}: 无 API key，仅复制源文件")
                new_data = dict(new_src)
            else:
                all_keys = list(new_src.keys())
                trans = translator.translate_delta(
                    new_src, all_keys, sp, f'{lang}/{name}')
                new_data = {}
                skip_keys = set(config.preserve.get('skip_keys', []))
                for _, batch_result in trans.items():
                    for k, v in batch_result.items():
                        if isinstance(v, str) and k not in skip_keys:
                            new_data[k] = v
                for k in all_keys:
                    if k not in new_data:
                        new_data[k] = new_src[k]

        # 保存
        save_json(out_path, new_data, list(new_src.keys()))
        cn = sum(1 for v in new_data.values()
                if isinstance(v, str) and CJK_PAT.search(v))
        print(f"  [{lang}] {name} 完成 | {len(new_data)}键 | 中文{cn}条")
        results.setdefault(lang, {})[out_path] = len(new_data)

    return results


def cmd_translate(args):
    """translate 命令入口"""
    config = I18nConfig.load(args.config)
    translator = Translator(config)

    if not translator.api_key and not args.baseline:
        print("⚠ 未设置 API key 且无 baseline，无法执行任何翻译")
        print(f"  请在 config.yml 的 api.base_url 中填写 API 地址")
        print(f"  并将 API key 写入环境变量 {config.api.get('api_key_env', 'I18N_API_KEY')}")
        return

    new_dir = args.new
    baseline_dir = args.baseline

    if not os.path.isdir(new_dir):
        print(f"✗ 目录不存在: {new_dir}")
        return
    if baseline_dir and not os.path.isdir(baseline_dir):
        print(f"✗ baseline 目录不存在: {baseline_dir}")
        return

    print(f"源语言: {config.source_lang}")
    print(f"目标语言: {', '.join(config.target_langs)}")
    print(f"文件组: {', '.join(g['name'] for g in config.file_groups)}")
    if translator.api_key:
        print(f"API: {translator.model} @ {config.api.get('base_url', '')}")
    else:
        print(f"API: 未配置（仅 diff/继承模式）")
    print()

    all_results = {}
    for group in config.file_groups:
        group_results = process_group(config, new_dir, baseline_dir,
                                      group, translator)
        all_results.update(group_results)

    print(f"\n{'='*60}")
    total = sum(sum(vals.values()) for vals in all_results.values())
    print(f"全部完成: {len(all_results)} 种语言, {total} 个键")
    print(f"输出目录: {new_dir}")


def cmd_check(args):
    """check 命令入口"""
    config = I18nConfig.load(args.config)
    check_quality(config, args.dir)


# ╔═══════════════════════════════════════════════════════╗
# ║                   CLI Entry                           ║
# ╚═══════════════════════════════════════════════════════╝

def main():
    parser = argparse.ArgumentParser(
        description='i18n-delta: 通用多语言增量翻译框架',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  %(prog)s translate --new ./0528/ --baseline ./0525/ --config config.yml
  %(prog)s translate --new ./0528/ --config config.yml
  %(prog)s check    --dir ./0528/ --config config.yml
        """.strip())

    sub = parser.add_subparsers(dest='command', required=True)

    t = sub.add_parser('translate', help='增量或全量翻译')
    t.add_argument('--new', required=True, help='新版本源文件目录')
    t.add_argument('--baseline', default=None, help='旧版本目录（可选，有则增量）')
    t.add_argument('--config', required=True, help='YAML 配置文件路径')
    t.set_defaults(func=cmd_translate)

    c = sub.add_parser('check', help='质量检查（扫描中文残留）')
    c.add_argument('--dir', required=True, help='检查的目标目录')
    c.add_argument('--config', required=True, help='YAML 配置文件路径')
    c.set_defaults(func=cmd_check)

    args = parser.parse_args()
    args.func(args)


if __name__ == '__main__':
    main()
