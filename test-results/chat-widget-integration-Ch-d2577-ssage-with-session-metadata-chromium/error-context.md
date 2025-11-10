# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - heading "Embedded Chat Widget Test Page" [level=1] [ref=e4]
    - paragraph [ref=e5]: This page demonstrates the embedded chat widget loaded via iframe.
    - generic [ref=e6]:
      - heading "Widget Features:" [level=2] [ref=e7]
      - list [ref=e8]:
        - listitem [ref=e9]: Loaded via iframe for isolation
        - listitem [ref=e10]: Fixed position in bottom-right corner
        - listitem [ref=e11]: Auto-opens on page load (for testing)
        - listitem [ref=e12]: Session tracking enabled
        - listitem [ref=e13]: Programmatic API available via window.ChatWidget
    - generic [ref=e14]:
      - heading "Test Features:" [level=2] [ref=e15]
      - list [ref=e16]:
        - listitem [ref=e17]: Widget should auto-open on page load
        - listitem [ref=e18]: Session metadata should be tracked in localStorage
        - listitem [ref=e19]: Chat messages include session_metadata in API requests
        - listitem [ref=e20]: Use window.ChatWidget API to control the widget
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e26] [cursor=pointer]:
    - img [ref=e27]
  - alert [ref=e30]
  - iframe [ref=e31]:
    
```