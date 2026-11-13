# QR Studio — QR Code Generator

Responsive, minimal QR generator with a Scandinavian-inspired interface.

## Included
- QR codes for URLs, text, Wi-Fi, email and contact cards
- Live preview, custom colors and image sizes
- PNG and SVG downloads
- Light and dark themes
- Responsive mobile layout
- Local browser-side generation; no backend or upload of user content

## Run locally
This is a static site. Open `index.html` in a browser, or use VS Code Live Server.
The QR rendering library is loaded from cdnjs, so an internet connection is needed.

## Deploy to Cloudflare Pages
1. Create a GitHub repository named `qr-studio`.
2. Upload `index.html`, `styles.css`, `app.js`, and `README.md` to the repository root.
3. In Cloudflare, open Workers & Pages → Create → Pages → Connect to Git.
4. Select the repository.
5. Framework preset: None.
6. Build command: leave blank.
7. Build output directory: `/` (repository root).
8. Deploy.

## Backend
No backend is required for QR generation. The QR is created in the visitor's browser, which is faster and avoids transmitting private Wi-Fi or contact information to a server. Analytics, if added later, should be privacy-conscious and disclosed in a privacy policy.
