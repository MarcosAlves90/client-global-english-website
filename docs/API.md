# Administrative API

The routes below are implemented under `app/api/admin`. Every route requires an `Authorization: Bearer <Firebase ID token>` header. The token must resolve to a Firestore user document with `role: "admin"`; missing or invalid tokens return `401`, and non-admin users return `403`.

Request and response validation is defined in [`lib/contracts/admin.ts`](../lib/contracts/admin.ts) and [`lib/contracts/shared.ts`](../lib/contracts/shared.ts). Invalid JSON or bodies return `400`.

## Courses

| Method | Path | Query/body | Success |
| --- | --- | --- | --- |
| GET | `/api/admin/courses` | Optional `includeMetrics=true` | Course summary array by default; with metrics returns `{ "items": [...], "metrics": { ... } }` |
| POST | `/api/admin/courses` | Course fields such as `title`, `description`, `level`, `durationWeeks`, `coverUrl`, `status` | `201` with created course |
| PATCH | `/api/admin/courses` | JSON body with `id` and fields to update | `{ "ok": true }` |
| DELETE | `/api/admin/courses` | `{ "id": "course-id" }` | `{ "ok": true }`; cascades related course data in the route implementation |

## Tracks, materials, and activities

| Resource | List | Create | Update | Delete |
| --- | --- | --- | --- | --- |
| Tracks | `GET /api/admin/tracks?courseId=...` | `POST /api/admin/tracks` | `PATCH /api/admin/tracks` | `DELETE /api/admin/tracks` |
| Materials | `GET /api/admin/materials?courseId=...` | `POST /api/admin/materials` | `PATCH /api/admin/materials` | `DELETE /api/admin/materials` |
| Activities | `GET /api/admin/activities?courseId=...` | `POST /api/admin/activities` | Not exposed by this route | `DELETE /api/admin/activities` |

Track, material, and activity delete requests use `{ "id": "resource-id" }`. Create and update payloads are validated by the corresponding Zod schemas. Activity types are `lesson`, `quiz`, `assignment`, and `project`; material types are `pdf`, `video`, `link`, `audio`, and `markdown`; visibility is `module`, `users`, or `private`. Activity creation also accepts optional `releaseAt`, `dueAt`, and `closeAt` date strings. `dueAt` marks late work while `closeAt` blocks subsequent student writes through Firestore rules.

Example list request:

```bash
curl -H "Authorization: Bearer $FIREBASE_ID_TOKEN" \
  "http://localhost:3000/api/admin/activities?courseId=course-id"
```

## Activity progress

`GET /api/admin/activity-progress?courseId=course-id` returns progress records for the course. Add `activityId=activity-id` to filter to one activity. `courseId` is required.

## Teacher activity grading

Routes under `/api/teacher/*` require a Firebase token whose Firestore user role is `teacher` or `admin`. A teacher is additionally authorized against the course's `teacherIds`; administrators may access all courses.

- `GET /api/teacher/activity-progress?courseId=...` lists completed and in-progress records for an assigned course. `activityId` is optional.
- `PATCH /api/teacher/activity-progress` reviews a completed submission. `action: "grade"` stores a final teacher score and optional feedback; `action: "request_revision"` requires feedback and reopens the submission for the student. Payloads without `action` remain compatible with the previous grade behavior.
- `GET /api/teacher/gradebook?courseId=...` returns the assigned course roster, activity columns, and grade/review states without returning student answer contents. Final Gradebook averages use only teacher grades with `gradingStatus: "graded"`; automatic scores are shown only as references while a submission awaits review.

Teacher review fields remain server-managed. During an explicit revision request, Firestore permits the owning student to edit the same activity even after its normal close date and permits only the `revision_requested -> pending` grading transition when the student completes the resubmission.

## Attachments

`DELETE /api/admin/attachments` removes an attachment from a `material` or `activity` and deletes its Cloudinary asset when the URL can be resolved. The body is:

```json
{
  "entityType": "material",
  "entityId": "material-id",
  "attachmentUrl": "https://res.cloudinary.com/example/raw/upload/file.pdf"
}
```

The route returns `{ "ok": true }` on success, `404` when the entity or attachment is not found, and `400` for invalid input.

## Users

| Method | Path | Query/body | Success |
| --- | --- | --- | --- |
| GET | `/api/admin/users?pageSize=12&cursor=...` | `pageSize` is clamped to 1–50; `cursor` is optional | `{ "items": [...], "nextCursor": string \| null, "stats": { ... } }` |
| POST | `/api/admin/users` | User fields such as `name`, `email`, `role`, `team`, `isRobot` | `201` with created user summary |
| PATCH | `/api/admin/users` | User fields with `uid` | `{ "ok": true }` |
| DELETE | `/api/admin/users` | `{ "uid": "user-id" }` | `{ "ok": true }` |

The current admin user is excluded from the GET listing.

## Errors

Error responses use a JSON object with an `error` string. Common statuses are `400` for invalid input, `401` for missing/invalid authentication, `403` for non-admin access, `404` for missing resources, `409` for conflicts detected by a route, and `500` for unexpected server/database failures.
