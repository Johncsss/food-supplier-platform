# Vercel Environment Variables Setup

Extract these values from `serviceAccountKey.json`:

## Environment Variables for Vercel

Copy these exact values from your `serviceAccountKey.json` file:

### From serviceAccountKey.json → Vercel Environment Variable

```
FIREBASE_PROJECT_ID = "foodbooking-3ccec"
```

```
FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCozveArPe2CCIf\nhr4uWcoclEdlW0xTqWZ55z+Yv5+qO35D0R9h6n7o0KKlJxlZK3TlkWN4UCQx0ZVg\nAd+/qEhVMLJ/bbZYmfW+X4cSQmeznCyq18M3mbInzDb9e+0slVa9+QoDM+JkeyjA\nSkG+eVaPavrSHO4++wspn2m5NyW0NutfdsF10g4gAdnHh9ViSvKpvQ7bkemm2g3X\nIEwzs9fDkoDN5LCsYwoDKLH1jSDmaD7TVz4U6i5W/6/9ikD5YuiAhSSDBQPL2g3b\nDFJks321UX6U5XsAl8hG+2pCHX8Cn+ElpAxBmzbU++M5o1BQT4EUoBNN7djgBXMu\nBZd6dfpJAgMBAAECggEAD/MaMdy7PPDwycTGlFo50qXJ8dAvWoTvdfDSXUwsZFO3\nCZD+jkGvQwUaJlDsQAoZ7eo6Q+8NNG3RLMnl36shRndRmOD/W8i+44FizD1c+fyg\nFcuexNKZ9tEAmHEMnEFHTwTIRubbQFOIqqkkJBXn2/4ne7xttaKs+n5MPsqbSTcd\n45XZL5NYMa28NoClMcNHjVyJZsaxbPgNyxpyTpMUjUX/lagWk3HeQo+RW/mPbLU6\nvi2l/3td/1QySfF2ArSieSGkBuMs8OS0JmynnjdW2dH1TLkFnZlAr28U/QvkqGtJ\ne5s4CTa7Bc+Q68RdZj6gKXBSYVsv1rOYJIKcSNXK7wKBgQDU/iOzRKag7Wiuuker\naQeLV+gDUAnBM+5nQertIMLkO/H2iIIovidC3/P1aKPcwfEwz9diEQ1YILHHPfq/\nfazQTL9UHTSqum/8AGMyfLYqncfp+696aqcpZaTnvanyJg/quGT5mpAjcCC3aSgX\nAjZ0RvWs2g3a7umRnbkqEkHWBwKBgQDK5OMmjYjXusUUFUGcFTuMnJi3JuZx9MdA\nZC4ZSzTKCOj8K5Y9q84ixrdOd5v8wODU6qEnUK7EqvqSTVdn5itVqukNUlqTs+Q4\nruvgmG1048jQ2stktl8orJSmobaHz895yIlDWZV3knlWk40gDBDcdR4QQMCK+syz\n6QemE38ZLwKBgEslRs8uv2Mzn6VVz4doTOMapp7UlDx35/rCRPJYhqojhCCo1NMv\nE4cCoH3K51Uxj7ja+3B796tKDa7v7RG2c0wiZ7Zzf2tkz7GnKVhcq6CpfijNRYH5\nMvTmCaJBRj5Ks37qg6WUpJn8K27KSPylKTUo+/B6Fj1R4VIgxX1UZ6ntAoGADPDU\nXB0i4T+UWleQu7fO+IT0aJoekJ4gJ0c8eXiGgWxYD91n078lgqpR/rs6Q8C5llrw\ntGU9AGY3XSV5sbLIiMpB2wupo0oSAFuHx+dw88ejg06xMlc/coSvZoFh9v+WKBpW\nRulr0xiQjKkUkzqxyJ3fsQGwRi0A6WiviDQuIxkCgYBRsDD/XU9D5Q/1GBDD4G6v\nXrySdv3WL6spdYyvoY0JV4qW6sQ4DIryGWGu5c0ZJxMvApx4qQcvvHnhYxffSkKe\n740OeDLe8l6SHFJ94fP7uz8jR6qOS1dl0FWr5Lc/9KfVJXFkB0HMFT1mG5QQDzvh\nWpELrr62hgz1GPeESqZJbQ==\n-----END PRIVATE KEY-----\n"
```

```
FIREBASE_CLIENT_EMAIL = "firebase-adminsdk-fbsvc@foodbooking-3ccec.iam.gserviceaccount.com"
```

```
FIREBASE_CLIENT_ID = "117374508906590855122"
```

```
FIREBASE_CLIENT_X509_CERT_URL = "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40foodbooking-3ccec.iam.gserviceaccount.com"
```

```
FIREBASE_DATABASE_URL = "https://foodbooking-3ccec-default-rtdb.asia-southeast1.firebasedatabase.app"
```

## Optional (but can be useful)

```
FIREBASE_PRIVATE_KEY_ID = "586d3fa86c28120d3837c857e5406184dfe6cada"
```

## How to Add to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable above with its corresponding value
4. Make sure to select **Production**, **Preview**, and **Development** environments
5. For `FIREBASE_PRIVATE_KEY`, keep the `\n` characters (they will be converted to actual newlines)

## Important Notes

- The `FIREBASE_PRIVATE_KEY` should include the entire key with `\n` characters preserved
- All values are already in your `serviceAccountKey.json` file
- Make sure `serviceAccountKey.json` is in `.gitignore` (which it is) - never commit this file!

