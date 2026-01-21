# Meta Ads Integration

This folder contains the Meta Ads API connector.

## Files to Create

- `client.ts` - Meta API client initialization
- `auth.ts` - OAuth flow handling
- `fetch.ts` - Data fetching functions
- `types.ts` - Meta-specific types

## API Reference

- Meta Marketing API: https://developers.facebook.com/docs/marketing-apis/

## Key Endpoints

- `/act_{ad_account_id}/insights` - Get ad performance data

## Required Scopes

- `ads_read`
- `ads_management`
