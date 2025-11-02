import"./chunks/chunk-Y6SLVHK3.js";function l(a={}){let i=a.appearance||{},e=i.position||"bottom-right",t=i.primaryColor||"#3b82f6",n=document.createElement("div");n.id="omniops-minimal-loader";let c=e.includes("right"),m=e.includes("bottom");n.style.cssText=`
    position: fixed;
    ${c?"right: 20px;":"left: 20px;"}
    ${m?"bottom: 20px;":"top: 20px;"}
    z-index: 9999;
  `;let o=document.createElement("button");if(o.setAttribute("aria-label","Open chat"),o.style.cssText=`
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: ${t};
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s, box-shadow 0.2s;
    position: relative;
  `,o.addEventListener("mouseenter",()=>{o.style.transform="scale(1.05)",o.style.boxShadow="0 6px 20px rgba(0,0,0,0.2)"}),o.addEventListener("mouseleave",()=>{o.style.transform="scale(1)",o.style.boxShadow="0 4px 12px rgba(0,0,0,0.15)"}),o.innerHTML=`
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  `,i.showNotificationBadge){let r=document.createElement("span");r.style.cssText=`
      position: absolute;
      top: 8px;
      right: 8px;
      width: 12px;
      height: 12px;
      background-color: #ef4444;
      border-radius: 50%;
      border: 2px solid white;
    `,o.appendChild(r)}if(i.showPulseAnimation){let r=document.createElement("span");if(r.style.cssText=`
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 50%;
      border: 2px solid ${t};
      animation: omniops-pulse 2s infinite;
      opacity: 0.5;
      pointer-events: none;
    `,o.appendChild(r),!document.getElementById("omniops-pulse-animation")){let s=document.createElement("style");s.id="omniops-pulse-animation",s.textContent=`
        @keyframes omniops-pulse {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.3;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }
      `,document.head.appendChild(s)}}return n.appendChild(o),n}async function d(a,i){let e=document.getElementById("omniops-minimal-loader");if(e){let t=e.querySelector("button");t&&(t.innerHTML=`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 12 12"
              to="360 12 12"
              dur="1s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
      `)}try{let{initWidget:t}=await import("./chunks/widget-standalone-MOZCLMJT.js");e&&e.remove(),t(a,i)}catch(t){if(console.error("[Omniops] Failed to load full widget:",t),e){let n=e.querySelector("button");n&&(n.innerHTML=`
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        `)}}}var p=!1;function u(a,i={}){let e=l(i);document.body.appendChild(e);let t=e.querySelector("button");t&&t.addEventListener("click",async()=>{p||(p=!0,await d(a,i))}),console.log("[Omniops Widget] Minimal loader initialized (vanilla JS)")}typeof window<"u"&&(window.OmniopsWidget={initWidget:u});export{u as initWidget};
