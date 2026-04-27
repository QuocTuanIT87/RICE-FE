/**
 * Tiện ích hiển thị màn hình khóa bản quyền phong cách Blue Screen of Death (BSOD)
 */
export const showLicenseOverlay = (message: string) => {
  // Tránh tạo nhiều overlay
  if (document.getElementById("license-error-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "license-error-overlay";

  // Style cho toàn màn hình BSOD
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: #0078d4;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: white;
    overflow: hidden;
    cursor: default;
    user-select: none;
  `;

  overlay.innerHTML = `
    <style>
      @keyframes bsodFade { from { opacity: 0; } to { opacity: 1; } }
      .bsod-wrapper {
        max-width: 1100px;
        width: 90%;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        animation: bsodFade 0.5s ease-in;
      }
      .bsod-content { flex: 1; }
      .bsod-face { font-size: 160px; margin-bottom: 20px; line-height: 1; font-weight: 300; }
      .bsod-title { font-size: 32px; line-height: 1.4; margin-bottom: 40px; font-weight: 300; }
      .bsod-progress { font-size: 32px; margin-bottom: 40px; font-weight: 300; }
      .bsod-footer { display: flex; align-items: center; gap: 20px; }
      .bsod-qr { width: 100px; height: 100px; background: white; padding: 5px; }
      .bsod-info { font-size: 14px; line-height: 1.6; opacity: 0.9; }
      .bsod-logo { width: 300px; opacity: 0.8; margin-top: 50px; }
    </style>
    
    <div class="bsod-wrapper">
      <div class="bsod-content">
        <div class="bsod-face">:(</div>
        
        <div class="bsod-title">
          Your application ran into a problem and needs to be activated. We're just collecting some license info, and then we'll restart for you.
        </div>

        <div class="bsod-progress">40% complete</div>

        <div class="bsod-footer">
          <div class="bsod-qr">
            <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
              <path d="M10 10h30v30h-30zM60 10h30v30h-30zM10 60h30v30h-30zM45 45h10v10h-10zM15 15h20v20h-20zM65 15h20v20h-20zM15 65h20v20h-20z" fill="#0078d4"/>
              <path d="M45 10h10v10h-10zM10 45h10v10h-10zM60 45h10v10h-10zM45 60h10v10h-10zM80 60h10v10h-10z" fill="#0078d4"/>
            </svg>
          </div>
          <div class="bsod-info">
            For more information about this issue and possible fixes, visit https://www.windows.com/stopcode<br/><br/>
            If you call a support person, give them this info:<br/>
            Stop code: <b>LICENSE_EXPIRED_OR_INVALID</b><br/>
            System message: <i>${message}</i>
          </div>
        </div>
      </div>

      <div class="bsod-logo">
        <svg viewBox="0 0 100 100" style="width: 100%; fill: white;">
          <path d="M0 12l45-6v42h-45zM48 6l52-7v49h-52zM0 50h45v43l-45-6zM48 50h52v50l-52-7z"/>
        </svg>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";
};
