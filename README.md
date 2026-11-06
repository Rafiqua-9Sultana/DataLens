# 📊 DataLens — Interactive Data Analytics Dashboard

**Explore. Visualize. Understand.**

DataLens is an interactive CSV analytics dashboard built with React and TypeScript. It helps users explore datasets, understand data quality, discover patterns, visualize relationships, and clean their data through an intuitive dashboard.

---

## ✨ Features

### 📁 CSV Dataset Upload
- Upload CSV files through file selection or drag and drop.
- Automatically parse CSV data.
- Display dataset dimensions and statistics.
- Detect missing values and duplicate records.

### 📊 Interactive Dashboard
- View dataset statistics.
- Get an overview of data quality.
- Explore numerical summaries.
- Discover useful dataset insights.

### 🔍 Data Explorer
- Preview uploaded datasets in a structured table.
- Search and filter records.
- View column information.
- Identify numerical, categorical, date, and text columns.

### 📈 Data Visualizations
- Interactive charts using Recharts.
- Department and grade distribution charts.
- Numerical data visualizations.
- Pearson correlation heatmap using Plotly.
- Outlier detection using the IQR method.

### 🧹 Data Cleaning
- Detect missing values.
- Identify duplicate records.
- Remove duplicate rows.
- Replace missing values with `N/A`.
- Download the cleaned dataset as a CSV file.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| TypeScript | Type-safe development |
| Vite | Development server and build tool |
| PapaParse | CSV parsing and processing |
| Recharts | Interactive charts |
| Plotly.js | Correlation heatmap |
| Lucide React | Icons |
| CSS | Dashboard styling |

---

## 📂 Project Structure

```text
DataLens/
│
├── public/
│
├── src/
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   └── ...
│
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/DataLens.git
```

### 2. Navigate to the project directory

```bash
cd DataLens
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
```

---

## 💡 How It Works

1. Upload a CSV dataset.
2. DataLens parses and processes the uploaded data.
3. Explore dataset statistics and column profiles.
4. View interactive charts and correlation analysis.
5. Identify missing values, duplicates, and outliers.
6. Clean the dataset and download the processed CSV.

---

## 🎯 Project Goals

DataLens aims to make dataset exploration and preprocessing more accessible through a clean, interactive interface.

The project combines frontend development, data processing, statistical analysis, and interactive visualization in one application.

---

## 🔮 Future Improvements

- AI-assisted data insights.
- More advanced visualization options.
- Customizable chart configurations.
- Advanced data transformation tools.
- Export visualizations and analysis reports.
- Support for additional dataset formats.

---

## 👩‍💻 Author

**Rafiqua Sultana**

Aspiring AI and Machine Learning Engineer

- GitHub: https://github.com/Rafiqua-9Sultana
- LinkedIn: https://www.linkedin.com/in/rafiqua-sultana-a03270252

---

<p align="center">
  Built with ❤️ using React, TypeScript, and modern data visualization tools.
</p>