/**
 * index.js — webpack JS entry (CSS-only)
 *
 * ⚠️  This project uses static multi-page HTML as the sole runtime architecture.
 *     Pages in src/pages/ load JS directly via <script src="/assets/js/..."> tags.
 *     JS bundles from webpack are NOT injected into any page (inject: false).
 *
 *     webpack is retained ONLY for:
 *       1. CSS pipeline  (styles.css via MiniCssExtractPlugin)
 *       2. Asset copying (lang/, images/, sw.js via CopyWebpackPlugin)
 *       3. HTML templating (HtmlWebpackPlugin, inject:false)
 *
 *     All runtime JS is loaded directly by pages via <script defer> tags.
 *     See src/index.html (SPA shell) for the complete script manifest.
 */
import "./assets/css/styles.css";
