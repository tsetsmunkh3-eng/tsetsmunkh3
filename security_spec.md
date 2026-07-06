# Security Specification - Scores Collection

## Data Invariants
1. A score document must contain `playerName`, `score`, `gameType`, `answers`, and `createdAt`.
2. Score documents are strictly **immutable**: once written, they cannot be updated or deleted by anyone. This prevents leaderboard tampering.
3. Anyone can read the scores to view the leaderboard.
4. Anyone can create a score, but it must adhere to strict validation constraints.

## Constraints
- `playerName` must be a string between 1 and 50 characters.
- `score` must be a non-negative integer.
- `gameType` must be a string (e.g. 'anime', 'anime-emoji', 'anime-character').
- `createdAt` must be set to the server's request time.
- `answers` must be a list containing details of each answered question.

## Rules Draft
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }

    match /scores/{scoreId} {
      allow read: if true;
      allow create: if isValidScore(request.resource.data);
      allow update, delete: if false;
    }
  }
}
```
