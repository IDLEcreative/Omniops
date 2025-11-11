# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - heading "Chat Widget Test Page" [level=1] [ref=e4]
    - paragraph [ref=e5]: This is a test page for the chat widget with multi-language support. The widget should appear in the bottom-right corner.
    - generic [ref=e6]:
      - button "English" [ref=e7] [cursor=pointer]
      - button "Español" [ref=e8] [cursor=pointer]
      - button "العربية" [ref=e9] [cursor=pointer]
    - paragraph [ref=e10]: Use the buttons above to switch languages. The widget will reload with the selected language.
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e16] [cursor=pointer]:
    - img [ref=e17]
  - alert [ref=e20]
  - iframe [active] [ref=e21]:
    - dialog "Chat support widget" [ref=f1e3]:
      - generic [ref=f1e4]:
        - generic [ref=f1e5]:
          - generic "Online" [ref=f1e6]
          - generic [ref=f1e7]:
            - heading "Support" [level=3] [ref=f1e8]
            - paragraph [ref=f1e9]: Online - We typically reply instantly
        - generic [ref=f1e10]:
          - button "Toggle high contrast mode. Currently off" [ref=f1e11] [cursor=pointer]:
            - img [ref=f1e12]
          - button "Close chat widget" [ref=f1e15] [cursor=pointer]:
            - img [ref=f1e16]
      - log "Chat messages" [ref=f1e19]:
        - paragraph [ref=f1e21]: Hello! How can we help you today?
      - generic [ref=f1e23]:
        - generic [ref=f1e24]: Type your message...
        - textbox "Type your message..." [active] [ref=f1e25]: Hello, what products do you have?
        - 'button "Change text size. Current: normal" [ref=f1e26]':
          - img [ref=f1e27]
        - button "Send" [ref=f1e29]:
          - img [ref=f1e30]
```