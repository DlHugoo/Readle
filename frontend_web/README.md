# Readle

**Readle** is an innovative digital reading platform designed to address the reading comprehension crisis among Filipino elementary students.

## 👥 Members

| Full Name                  | GitHub Profile                                |
| -------------------------- | --------------------------------------------- |
| Hugo, Dave Lawrence B.     | [DlHugoo](https://github.com/DlHugoo)         |
| Dotarot, Marc Andre C.     | [BlackLazuli](https://github.com/BlackLazuli) |
| LLaban, Feerdee Anne C.    | [KDazai](https://github.com/KDazai)           |
| Sombrio, Donald Grant D.   | [don-pao](https://github.com/don-pao)         |
| Suson, Katrina Miguelle G. | [katheyismey](https://github.com/katheyismey) |

## 🚀 Key Features

- 📚 **Library and Book Selection** – Offers DepEd-aligned digital books across varying difficulty levels.

- 🧠 **Comprehension Challenges** – Builds recall, inference, prediction, and cause-effect skills through interactive activities.

- 🎮 **Gamified Learning** – Motivates students with badges, achievements, and real-time feedback.

- 📊 **Progress Tracking** – Monitors student comprehension and reading habits over time.

- 👩‍🏫 **Student-Teacher Learning** – Enables teachers to curate content, track performance, and personalize learning.

## 🛠️ Installation Guide

> **Prerequisites:**
>
> - Node.js (v18 or higher)
> - Java Development Kit (JDK) 17
> - Maven

### Steps:

1. Clone the repository:
   ```sh
   git clone https://github.com/your-repository/Readle.git
   cd Readle
   ```
2. Open MySQL Workbench and create a new schema named `readle`.

3. Navigate to the backend directory:
   ```sh
   cd backend
   ```
4. Configure file `application.properties` and add the following:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/readle
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```
5. Run the Spring Boot application:
   ```sh
   mvn spring-boot:run
   ```
6. Open a new terminal window and navigate to the frontend directory:
   ```sh
   cd frontend_web
   ```
7. Install dependencies:
   ```sh
   npm install
   ```
8. Run the web development server:
   ```sh
   npm run dev
   ```
9. Open `http://localhost:5173` in your browser.

## 🔧 Environment Configuration

### For Local Development
Create a `.env.local` file in the `frontend_web` directory:
```env
VITE_API_BASE_URL=http://localhost:3000
```

### For Production Deployment
The app is configured to work with Vercel's proxy system. No additional configuration is needed for production deployment.

### Alternative: Custom Domain Setup
If you want to use a custom domain for your API:

1. Get a domain name (e.g., `api.yourdomain.com`)
2. Point it to your EC2 instance IP
3. Create a `.env.production` file:
   ```env
   VITE_API_BASE_URL=https://api.yourdomain.com
   ```