# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]: "404"
      - generic [ref=e6]: Page not found
      - generic [ref=e7]: Sorry, we couldn't find the page you're looking for.
    - generic [ref=e9]:
      - link "Go home" [ref=e10] [cursor=pointer]:
        - /url: /
        - img
        - text: Go home
      - link "Get started" [ref=e11] [cursor=pointer]:
        - /url: /setup
        - img
        - text: Get started
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e17] [cursor=pointer]:
    - img [ref=e18]
  - alert [ref=e21]
```