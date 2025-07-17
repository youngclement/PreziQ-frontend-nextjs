# PreziQ! - Next.js Project

Welcome to **PreziQ!**, a Next.js-based project designed to provide an interactive quiz and presentation experience. This README will guide you through setting up and running the project locally or accessing it online.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

* [Node.js](https://nodejs.org/) (version 18 or later recommended)
* npm (comes with Node.js)
* A code editor (e.g., [VS Code](https://code.visualstudio.com/))

## Installation

### 1. Clone the repository

Open your terminal and run the following command to clone the project:

```bash
git clone <repository-url>
```

Replace `<repository-url>` with the actual URL of your GitHub repository.

### 2. Navigate to the project directory

```bash
cd <project-folder>
```

Replace `<project-folder>` with the name of the folder where the project is cloned.

### 3. Install dependencies

Run the following command to install all required packages. Use the `--legacy-peer-deps` flag to avoid potential peer dependency issues:

```bash
npm i --legacy-peer-deps
```

## Running the Project Locally

### 1. Start the development server

After installing dependencies, start the project with:

```bash
npm run dev
```

### 2. Access the application

Open your browser and go to:

```
http://localhost:5173
```

You should see the **PreziQ!** application running locally.

## Accessing Online

If you don’t want to run the project locally, you can access the live version directly at:

**URL:** [https://preziq.vercel.app/](https://preziq.vercel.app/)

## Troubleshooting

* **Dependency Issues:** If you encounter errors during `npm i`, ensure you’re using the `--legacy-peer-deps` flag. This helps resolve conflicts with peer dependencies.
* **Port Conflict:** If port `5173` is in use, you can change it by modifying the `package.json` script or using a tool like `lsof` to free the port.
* **Live Site Issues:** If the online version is unavailable, check back later or contact the project maintainer.

## Contributing

Feel free to contribute to this project! Fork the repository, make your changes, and submit a pull request. For major changes, please open an issue first to discuss.

## License

This project is licensed under the [MIT License](LICENSE).
