# Google Calendar Unibo

## How to create the .env file

You need to set:
- CLIENT_ID
- CLIENT_SECRET
- REFRESH_TOKEN

Using google console you can retrieve CLIENT_ID and CLIENT_SECRET:
- Create a project at https://console.cloud.google.com/
- Select the project
- Enable "Google Calendar API"
- Then go back to the Dashboard and go to OAuth consent screen
	- Create an External OAuth consent screen
- Go to Credentials page
	- Create a credential of type "OAuth client ID"
	- Add "https://developers.google.com/oauthplayground" to authorized redirect uris

To get a refresh token navigate to https://developers.google.com/oauthplayground:
- On OAuth 2.0 configuration (gear icon) toggle "Use your own OAuth credentials" and fill with your credentials
- Then on "Google Calendar API v3" select 
	- calendar
	- calendar.events
- Then authorize apis
- When you return on the playground click on "Exchange authorization code for tokens"

Now you have all you need

## How to run

First you need to install node_modules:
```bash
npm i
```

Than you can run the command:
```bash
node app --start=[valid-date] --end=[valid-date] --course=[course] --year=[year] --exclude=[c1,c2,...]
```

Example:
```bash
node app --start=20/02/2023 --end=27/02/2023 --course=IngegneriaInformatica --year=3 --exclude=38378,94442,B0832
```
