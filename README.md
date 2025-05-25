# 🧩 Community API - NestJS

A simple RESTful API built with [NestJS](https://nestjs.com/) for creating a user-based community platform. This project includes basic **user login**, **post (topic)** creation, and **commenting** features with one-level comments.

---

## 🚀 Features

- User login via **username only**
- Create and view **posts (topics)**
- **Comment** on posts (one-level only, no nested comments)
- Edit and delete only your own **posts** and **comments**
- Lightweight and easy to extend

---

## 🛠️ Tech Stack

- **NestJS** - Node.js framework
- **TypeORM** - ORM for database access
- **SQLite** - Lightweight embedded database

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/your-username/community-api.git
cd community-api/backend/nest-blog-post

# Install dependencies
npm install

# Start the application
npm run start:dev
```

---

## 📁 Project Structure

```
src/
├── auth/         # Simple user login via username
├── users/        # User management
├── posts/        # Topic/post CRUD
├── comments/     # One-level comments
├── app.module.ts
└── main.ts
```

---

## 🔑 API Endpoints

### 🔐 Auth/User

- `POST /users/login`  
  Login or register with username.  
  **Body:** `{ "username": "john" }`

---

### 📝 Posts

- `GET /posts`  
  View all posts with comments

- `POST /posts`  
  Create a post  
  **Body:** `{ "title": "My Topic", "content": "Hello", "category": 1, "userId": 1 }`

- `PUT /posts/:id`  
  Edit your post  
  **Body:** `{ "content": "Updated content", "userId": 1 }`

- `DELETE /posts/:id`  
  Delete your post  
  **Body:** `{ "userId": 1 }`

---

### 💬 Comments

- `POST /comments/:postId`  
  Add comment to a post  
  **Body:** `{ "content": "Nice post!", "userId": 1 }`

- `PUT /comments/:id`  
  Edit your comment  
  **Body:** `{ "content": "Edited comment", "userId": 1 }`

- `DELETE /comments/:id`  
  Delete your comment  
  **Body:** `{ "userId": 1 }`

---

## 🧪 Example Request

```bash
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{ "username": "john" }'
```

---

## 🙋‍♂️ Author
Developed by Wiwatsapon - for testing interview DataWoW

# ขอ Feedback ด้วยนะครับถ้าเป็นไปได้
