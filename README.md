# CatchAllAI.com

## Local Setup:

1. Create a .env file containing the following:

```
VITE_BASE44_APP_ID=6925162397800755912704a9
VITE_BASE44_BACKEND_URL=https://preview--catchall.base44.app
VITE_BASE44_ACCESS_TOKEN=<your_access_token>
```

>How to find your access token:
>1. Go to https://app.base44.com/apps/6925162397800755912704a9/editor/preview/dashboard
>2. Open Dev Tools and go to the Network Tab
>3. Scroll down and copy the string below "Bearer" that's next to "Authorization"

2. Run `npm i`
3. Run `npm run dev`
4. CatchAll should now be live and integrated with the backend on http://localhost:5173/ 