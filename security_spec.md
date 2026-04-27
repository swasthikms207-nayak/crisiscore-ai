# CrisisCore Security Specification (TDD)

## 1. Data Invariants
- A User can only modify their own profile (uid matches auth.uid).
- A User cannot change their `uid` or `email` after creation.
- An Alert can only be created by the victim (`victimUid` must match `auth.uid`).
- Only `RESCUER` roles can update the `status` of an alert to `EN_ROUTE`.
- Only the original Victim or a Rescuer can update an alert.
- All timestamps must be server-generated (`request.time`).
- Document IDs must be alphanumeric and length-limited.

## 2. The "Dirty Dozen" Payloads (Denial Expected)
1. **Identity Theft**: Unauthenticated user tries to write to `/users/any-uid`.
2. **Role Escalation**: Victim tries to update their role to `RESCUER` in an existing profile.
3. **Ghost Profile**: User tries to create a profile for a different `uid`.
4. **SOS Forgery**: User A tries to create an SOS alert with `victimUid` = "User B".
5. **State Shortcut**: Victim tries to set an alert status directy to `RESOLVED` without a rescuer.
6. **Shadow Field Injection**: Payload contains `isAdmin: true` which is not in the schema.
7. **Resource Exhaustion**: Sending a 1MB string in the `description` field.
8. **ID Poisoning**: Creating an alert with a 2KB long string as ID.
9. **Relational Bypass**: Creating an alert without a valid user profile.
10. **Time Warp**: Providing a client-side `createdAt` timestamp from 1990.
11. **PII Scraping**: Authenticated user B tries to read User A's `emergencyNumber`.
12. **Orphaned State**: Updating an alert's `status` to `EN_ROUTE` without assigning an `assignedRescuerId`.

## 3. Core Identity Helpers
```javascript
function isSignedIn() { return request.auth != null; }
function isOwner(userId) { return isSignedIn() && request.auth.uid == userId; }
function incoming() { return request.resource.data; }
function existing() { return resource.data; }
function isValidId(id) { return id is string && id.size() >= 1 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$'); }
```
