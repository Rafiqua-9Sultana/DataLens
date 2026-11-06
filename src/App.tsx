import Plot from "react-plotly.js";
import { useRef, useState } from "react";
import Papa from "papaparse";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import {
  LayoutDashboard,
  Database,
  BarChart3,
  Sparkles,
  Settings,
  Search,
  Bell,
  Upload,
  FileSpreadsheet,
  ArrowUpRight,
  Rows3,
  Columns3,
  AlertCircle,
  Activity,
  ChevronDown,
  CheckCircle2,
  Download,
  X,
} from "lucide-react";

import "./App.css";

type DataRow = Record<string, string>;

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // STATES
  // ==========================================

  const [data, setData] = useState<DataRow[]>([]);
  const [activePage, setActivePage] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [columns, setColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [missingValues, setMissingValues] = useState(0);
  const [duplicateRows, setDuplicateRows] = useState(0);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // ==========================================
  // CSV FILE HANDLING
  // ==========================================

  const handleFile = (file?: File) => {
    if (!file) return;

    setError("");

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a valid CSV file.");
      return;
    }

    Papa.parse<DataRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),

      complete: (results) => {
        if (!results.meta.fields || results.meta.fields.length === 0) {
          setError("The CSV file does not contain valid column headers.");
          return;
        }

        if (results.errors.length > 0 && results.data.length === 0) {
          setError("Unable to read this CSV file. Please check its format.");
          return;
        }

        const headers = results.meta.fields;

        const rows = results.data.filter((row) =>
          Object.values(row).some(
            (value) =>
              value !== undefined &&
              String(value).trim() !== ""
          )
        );

        const missing = rows.reduce((total, row) => {
          return (
            total +
            headers.filter(
              (column) =>
                row[column] === undefined ||
                row[column] === null ||
                String(row[column]).trim() === ""
            ).length
          );
        }, 0);

        const uniqueRows = new Set(
          rows.map((row) =>
            JSON.stringify(
              headers.map((column) => row[column] ?? "")
            )
          )
        );

        setData(rows);
        setColumns(headers);
        setFileName(file.name);
        setMissingValues(missing);
        setDuplicateRows(rows.length - uniqueRows.size);
        setSearchTerm("");
      },

      error: () => {
        setError("Something went wrong while reading the CSV file.");
      },
    });
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files[0]);
  };

  const clearDataset = () => {
    setData([]);
    setColumns([]);
    setFileName("");
    setMissingValues(0);
    setDuplicateRows(0);
    setSearchTerm("");
    setError("");
  };

  // ==========================================
  // DATA SEARCH AND FILTER
  // ==========================================

  const filteredData = data.filter((row) =>
    Object.values(row).some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
  );

  // ==========================================
  // AUTOMATIC COLUMN DETECTION
  // ==========================================

  const columnProfiles = columns.map((column) => {
    const values = data
      .map((row) => String(row[column] ?? "").trim())
      .filter((value) => value !== "");

    const numericCount = values.filter(
      (value) => Number.isFinite(Number(value))
    ).length;

    const dateCount = values.filter(
      (value) =>
        !Number.isFinite(Number(value)) &&
        !Number.isNaN(Date.parse(value))
    ).length;

    const uniqueCount = new Set(values).size;

    let type = "Text";

    if (values.length > 0 && numericCount / values.length >= 0.8) {
      type = "Numerical";
    } else if (values.length > 0 && dateCount / values.length >= 0.8) {
      type = "Date";
    } else if (
      values.length > 0 &&
      uniqueCount <= 20 &&
      uniqueCount / values.length <= 0.5
    ) {
      type = "Categorical";
    }

    return {
      name: column,
      type,
      uniqueValues: uniqueCount,
      totalValues: values.length,
    };
  });

  const numericalColumns = columnProfiles.filter(
    (profile) => profile.type === "Numerical"
  );

  const categoricalColumns = columnProfiles.filter(
    (profile) => profile.type === "Categorical"
  );

  const textColumns = columnProfiles.filter(
    (profile) => profile.type === "Text"
  );

  // ==========================================
  // SMART DATA SUMMARY
  // ==========================================

  const averageValues = numericalColumns.map((profile) => {
    const values = data
      .map((row) => Number(row[profile.name]))
      .filter((value) => Number.isFinite(value));

    const average =
      values.length > 0
        ? values.reduce((sum, value) => sum + value, 0) /
          values.length
        : 0;

    return {
      name: profile.name,
      average: average.toFixed(2),
    };
  });

  // ==========================================
  // CORRELATION ANALYSIS
  // ==========================================

  const correlationData = numericalColumns.map((columnA) => {
    const row: Record<string, number | string> = {
      name: columnA.name,
    };

    numericalColumns.forEach((columnB) => {
      const pairs = data
        .map((item) => ({
          x: Number(item[columnA.name]),
          y: Number(item[columnB.name]),
        }))
        .filter(
          (pair) =>
            Number.isFinite(pair.x) &&
            Number.isFinite(pair.y)
        );

      const count = pairs.length;

      const meanX =
        count > 0
          ? pairs.reduce((sum, pair) => sum + pair.x, 0) / count
          : 0;

      const meanY =
        count > 0
          ? pairs.reduce((sum, pair) => sum + pair.y, 0) / count
          : 0;

      const numerator = pairs.reduce(
        (sum, pair) =>
          sum + (pair.x - meanX) * (pair.y - meanY),
        0
      );

      const denominatorX = Math.sqrt(
        pairs.reduce(
          (sum, pair) => sum + (pair.x - meanX) ** 2,
          0
        )
      );

      const denominatorY = Math.sqrt(
        pairs.reduce(
          (sum, pair) => sum + (pair.y - meanY) ** 2,
          0
        )
      );

      row[columnB.name] =
        count < 2 || denominatorX === 0 || denominatorY === 0
          ? 0
          : Number(
              (numerator / (denominatorX * denominatorY)).toFixed(2)
            );
    });

    return row;
  });

  // ==========================================
  // OUTLIER DETECTION
  // ==========================================

  const outlierResults = numericalColumns.map((column) => {
    const values = data
      .map((row) => Number(row[column.name]))
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);

    const getMedian = (arr: number[]) => {
      if (arr.length === 0) return 0;

      const mid = Math.floor(arr.length / 2);

      return arr.length % 2 === 0
        ? (arr[mid - 1] + arr[mid]) / 2
        : arr[mid];
    };

    const middle = Math.floor(values.length / 2);

    const lowerHalf = values.slice(0, middle);

    const upperHalf =
      values.length % 2 === 0
        ? values.slice(middle)
        : values.slice(middle + 1);

    const q1 = getMedian(lowerHalf);
    const q3 = getMedian(upperHalf);

    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outliers = values.filter(
      (value) => value < lowerBound || value > upperBound
    );

    return {
      name: column.name,
      count: outliers.length,
      values: outliers,
      lowerBound,
      upperBound,
    };
  });

  // ==========================================
  // DATASET QUALITY SCORE
  // ==========================================

  const totalCells = data.length * columns.length;

  const missingPercentage =
    totalCells > 0 ? (missingValues / totalCells) * 100 : 0;

  const duplicatePercentage =
    data.length > 0
      ? (duplicateRows / data.length) * 100
      : 0;

  const qualityScore = Math.max(
    0,
    Math.round(100 - missingPercentage - duplicatePercentage)
  );

  // ==========================================
  // CHART DATA
  // ==========================================

  const scoreColumns = columns.filter((column) =>
    column.toLowerCase().includes("score")
  );

  const scoreChartData = scoreColumns.map((column) => {
    const values = data
      .map((row) => row[column]?.trim())
      .filter(
        (value): value is string =>
          value !== undefined && value !== ""
      )
      .map(Number)
      .filter(Number.isFinite);

    const average =
      values.length > 0
        ? values.reduce((sum, value) => sum + value, 0) /
          values.length
        : 0;

    return {
      subject: column
        .replace(/_score/i, "")
        .replace(/_/g, " "),
      average: Number(average.toFixed(2)),
    };
  });

  const departmentColumn = columns.find(
    (column) => column.toLowerCase() === "department"
  );

  const gradeColumn = columns.find(
    (column) => column.toLowerCase() === "grade"
  );

  const departmentCounts = data.reduce<Record<string, number>>(
    (counts, row) => {
      if (!departmentColumn) return counts;

      const department =
        row[departmentColumn]?.trim() || "Unknown";

      counts[department] = (counts[department] || 0) + 1;

      return counts;
    },
    {}
  );

  const departmentChartData = Object.entries(
    departmentCounts
  ).map(([name, value]) => ({
    name,
    value,
  }));

  const gradeCounts = data.reduce<Record<string, number>>(
    (counts, row) => {
      if (!gradeColumn) return counts;

      const grade = row[gradeColumn]?.trim() || "Unknown";

      counts[grade] = (counts[grade] || 0) + 1;

      return counts;
    },
    {}
  );

  const gradeChartData = Object.entries(gradeCounts).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  const chartColors = [
    "#64D8B2",
    "#78BDEB",
    "#FF897A",
    "#E9CB78",
    "#A78BFA",
  ];

  // ==========================================
  // DATA CLEANING FUNCTIONS
  // ==========================================

  const removeDuplicates = () => {
    const uniqueRows = new Map<string, DataRow>();

    data.forEach((row) => {
      const key = JSON.stringify(
        columns.map((column) => row[column] ?? "")
      );

      if (!uniqueRows.has(key)) {
        uniqueRows.set(key, row);
      }
    });

    const cleanedData = Array.from(uniqueRows.values());

    setData(cleanedData);
    setDuplicateRows(0);
  };

  const handleMissingValues = () => {
    const cleanedData = data.map((row) => {
      const updatedRow = { ...row };

      columns.forEach((column) => {
        if (
          updatedRow[column] === undefined ||
          updatedRow[column] === null ||
          updatedRow[column].trim() === ""
        ) {
          updatedRow[column] = "N/A";
        }
      });

      return updatedRow;
    });

    setData(cleanedData);
    setMissingValues(0);
  };

  const downloadCleanedCSV = () => {
    const csv = Papa.unparse(data);

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "datalens_cleaned_dataset.csv";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  // ==========================================
  // NAVIGATION
  // ==========================================

  const navigateTo = (page: string) => {
    setActivePage(page);
    setSearchTerm("");
  };

  const pageTitles: Record<string, string> = {
    overview: "Overview",
    explorer: "Data Explorer",
    visualizations: "Visualizations",
    cleaning: "Data Cleaning",
  };

  // ==========================================
  // USER INTERFACE
  // ==========================================

  return (
    <div className="app-container">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="logo">
          <div className="logo-icon">
            <BarChart3 size={22} />
          </div>

          <span>
            Data<span className="logo-highlight">Lens</span>
          </span>
        </div>

        <div className="workspace">

          <span className="workspace-label">
            WORKSPACE
          </span>

          <nav className="sidebar-nav">

            <a
              href="#overview"
              className={`nav-item ${
                activePage === "overview" ? "active" : ""
              }`}
              onClick={(event) => {
                event.preventDefault();
                navigateTo("overview");
              }}
            >
              <LayoutDashboard size={19} />
              <span>Overview</span>
            </a>

            <a
              href="#explorer"
              className={`nav-item ${
                activePage === "explorer" ? "active" : ""
              }`}
              onClick={(event) => {
                event.preventDefault();
                navigateTo("explorer");
              }}
            >
              <Database size={19} />
              <span>Data Explorer</span>
            </a>

            <a
              href="#visualizations"
              className={`nav-item ${
                activePage === "visualizations" ? "active" : ""
              }`}
              onClick={(event) => {
                event.preventDefault();
                navigateTo("visualizations");
              }}
            >
              <BarChart3 size={19} />
              <span>Visualizations</span>
            </a>

            <a
              href="#cleaning"
              className={`nav-item ${
                activePage === "cleaning" ? "active" : ""
              }`}
              onClick={(event) => {
                event.preventDefault();
                navigateTo("cleaning");
              }}
            >
              <Sparkles size={19} />
              <span>Data Cleaning</span>
            </a>

          </nav>
        </div>

        <div className="sidebar-bottom">

          <a className="nav-item">
            <Settings size={19} />
            <span>Settings</span>
          </a>

          <div className="profile-card">

            <div className="profile-avatar">
              R
            </div>

            <div className="profile-info">
              <strong>Rafiqua Sultana</strong>
              <span>Personal Workspace</span>
            </div>

            <ChevronDown size={16} />

          </div>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">

        {/* TOPBAR */}
        <header className="topbar">

          <div className="breadcrumb">
            Workspace <span>/</span> {pageTitles[activePage]}
          </div>

          <div className="topbar-actions">

            <div className="search-box">
              <Search size={17} />

              <input
                type="text"
                placeholder="Search dataset..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    navigateTo("explorer");
                  }
                }}
              />

              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button className="icon-button">
              <Bell size={19} />
              <span className="notification-dot"></span>
            </button>

            <div className="top-avatar">
              R
            </div>

          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <div className="dashboard-content">

          {/* ==================================
              OVERVIEW PAGE
          ================================== */}

          {activePage === "overview" && (
            <>

              {/* WELCOME SECTION */}
              <section className="welcome-section">

                <div>

                  <div className="welcome-label">
                    <Sparkles size={14} />
                    YOUR DATA WORKSPACE
                  </div>

                  <h1>
                    Turn data into <span>insights.</span>
                  </h1>

                  <p>
                    Upload your datasets, explore patterns, and discover
                    meaningful insights from your data.
                  </p>

                </div>

                <div className="date-badge">
                  <Activity size={16} />
                  Analytics Workspace
                </div>

              </section>

              {/* CSV UPLOAD */}
              <section className="upload-section">

                <div className="section-heading">

                  <div>
                    <h2>Import your dataset</h2>
                    <p>
                      Start by uploading a CSV file to explore your data.
                    </p>
                  </div>

                  <span className="supported-format">
                    CSV FORMAT
                  </span>

                </div>

                <div
                  className={
                    "upload-box " + (isDragging ? "dragging" : "")
                  }
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >

                  <div className="upload-icon">
                    <Upload size={25} />
                  </div>

                  <h3>Drop your CSV file here</h3>

                  <p>
                    or browse files from your computer
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    hidden
                    onChange={handleFileChange}
                  />

                  <button
                    className="upload-button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileSpreadsheet size={17} />
                    Choose CSV File
                  </button>

                  <span className="upload-note">
                    Supports .csv files
                  </span>

                </div>

                {error && (
                  <div className="error-message">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                {fileName && (
                  <div className="file-success">

                    <CheckCircle2 size={17} />

                    <span>
                      Successfully loaded:{" "}
                      <strong>{fileName}</strong>
                    </span>

                    <button
                      className="clear-button"
                      onClick={clearDataset}
                      title="Remove dataset"
                    >
                      <X size={17} />
                    </button>

                  </div>
                )}

              </section>

              {/* STATISTICS */}
              <section className="stats-section">

                <div className="section-heading">

                  <div>
                    <h2>Dataset Overview</h2>
                    <p>
                      Your dataset statistics will appear here.
                    </p>
                  </div>

                  <span className="live-badge">
                    LIVE ANALYTICS
                  </span>

                </div>

                <div className="stats-grid">

                  <div className="stat-card">

                    <div className="stat-top">
                      <div className="stat-icon purple">
                        <Rows3 size={19} />
                      </div>

                      <ArrowUpRight
                        size={17}
                        className="stat-arrow"
                      />
                    </div>

                    <span>Total Rows</span>
                    <h2>{data.length || "--"}</h2>
                    <p>Dataset records</p>

                  </div>

                  <div className="stat-card">

                    <div className="stat-top">
                      <div className="stat-icon blue">
                        <Columns3 size={19} />
                      </div>

                      <ArrowUpRight
                        size={17}
                        className="stat-arrow"
                      />
                    </div>

                    <span>Total Columns</span>
                    <h2>{columns.length || "--"}</h2>
                    <p>Dataset attributes</p>

                  </div>

                  <div className="stat-card">

                    <div className="stat-top">
                      <div className="stat-icon orange">
                        <AlertCircle size={19} />
                      </div>

                      <ArrowUpRight
                        size={17}
                        className="stat-arrow"
                      />
                    </div>

                    <span>Missing Values</span>
                    <h2>{fileName ? missingValues : "--"}</h2>
                    <p>Incomplete entries</p>

                  </div>

                  <div className="stat-card">

                    <div className="stat-top">
                      <div className="stat-icon green">
                        <Database size={19} />
                      </div>

                      <ArrowUpRight
                        size={17}
                        className="stat-arrow"
                      />
                    </div>

                    <span>Duplicate Rows</span>
                    <h2>{fileName ? duplicateRows : "--"}</h2>
                    <p>Repeated records</p>

                  </div>

                </div>
              </section>

              {/* SMART DATA SUMMARY */}
              {data.length > 0 && (
                <section className="smart-summary-section">

                  <div className="section-heading">
                    <h2>Smart Data Summary</h2>

                    <span className="supported-format">
                      Automated dataset analysis
                    </span>
                  </div>

                  <div className="summary-stats-grid">

                    <div className="summary-stat-card">
                      <span>Total Rows</span>
                      <h2>{data.length}</h2>
                    </div>

                    <div className="summary-stat-card">
                      <span>Total Columns</span>
                      <h2>{columns.length}</h2>
                    </div>

                    <div className="summary-stat-card">
                      <span>Numerical Columns</span>
                      <h2>{numericalColumns.length}</h2>
                    </div>

                    <div className="summary-stat-card">
                      <span>Categorical Columns</span>
                      <h2>{categoricalColumns.length}</h2>
                    </div>

                    <div className="summary-stat-card">
                      <span>Text Columns</span>
                      <h2>{textColumns.length}</h2>
                    </div>

                  </div>

                  <div className="average-summary-card">
                    <h3>Numerical Column Averages</h3>

                    <div className="average-summary-list">

                      {averageValues.map((item) => (
                        <div
                          className="average-summary-item"
                          key={item.name}
                        >
                          <span>
                            {item.name.replace(/_/g, " ")}
                          </span>

                          <strong>{item.average}</strong>
                        </div>
                      ))}

                    </div>
                  </div>

                </section>
              )}

              {/* DATASET QUALITY SCORE */}
              {data.length > 0 && (
                <section className="quality-section">

                  <div className="section-heading">
                    <h2>Dataset Quality Score</h2>

                    <span className="supported-format">
                      Data health assessment
                    </span>
                  </div>

                  <div className="quality-card">

                    <div className="quality-score-circle">
                      <div
                        className="quality-progress"
                        style={{
                          background: `conic-gradient(#64D8B2 ${
                            qualityScore * 3.6
                          }deg, #293D3B 0deg)`,
                        }}
                      >
                        <div className="quality-progress-inner">
                          <h2>{qualityScore}%</h2>
                          <span>Quality Score</span>
                        </div>
                      </div>
                    </div>

                    <div className="quality-details">

                      <h3>
                        {qualityScore >= 90
                          ? "Excellent Dataset"
                          : qualityScore >= 70
                          ? "Good Dataset"
                          : qualityScore >= 40
                          ? "Needs Improvement"
                          : "Poor Dataset"}
                      </h3>

                      <p>Here's your dataset health overview.</p>

                      <div className="quality-metric">
                        <span>Missing Values</span>
                        <strong>{missingValues}</strong>
                      </div>

                      <div className="quality-metric">
                        <span>Duplicate Rows</span>
                        <strong>{duplicateRows}</strong>
                      </div>

                      <div className="quality-metric">
                        <span>Total Records</span>
                        <strong>{data.length}</strong>
                      </div>

                    </div>
                  </div>
                </section>
              )}

            </>
          )}

          {/* ==================================
              DATA EXPLORER PAGE
          ================================== */}

          {activePage === "explorer" && (
            <>

              <section className="welcome-section">
                <div>
                  <div className="welcome-label">
                    <Database size={14} />
                    DATA EXPLORATION
                  </div>

                  <h1>
                    Explore your <span>dataset.</span>
                  </h1>

                  <p>
                    Search records, inspect columns, and understand
                    the structure of your uploaded data.
                  </p>
                </div>
              </section>

              <section
                id="data-explorer"
                className="data-preview-section"
              >

                <div className="section-heading">

                  <div>
                    <h2>Data Explorer</h2>
                    <p>
                      Explore the records inside your uploaded dataset.
                    </p>
                  </div>

                  <span className="live-badge">
                    DATA PREVIEW
                  </span>

                </div>

                {data.length > 0 ? (
                  <>

                    <div className="table-info">

                      <div className="table-search">
                        <Search size={17} />

                        <input
                          type="text"
                          placeholder="Search records..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            title="Clear search"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>

                      <span>
                        Showing {Math.min(filteredData.length, 10)} of{" "}
                        {filteredData.length} matching records
                      </span>

                      <span>{columns.length} columns</span>

                    </div>

                    <div className="table-container">

                      <table className="data-table">

                        <thead>
                          <tr>
                            {columns.map((column) => (
                              <th key={column}>
                                {column.replace(/_/g, " ")}
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>

                          {filteredData.length === 0 && (
                            <tr>
                              <td
                                colSpan={columns.length}
                                className="missing-cell"
                              >
                                No matching records found.
                              </td>
                            </tr>
                          )}

                          {filteredData.slice(0, 10).map(
                            (row, rowIndex) => (
                              <tr key={rowIndex}>
                                {columns.map((column) => {
                                  const value =
                                    row[column]?.trim() ?? "";

                                  return (
                                    <td
                                      key={column}
                                      className={
                                        value === "" ? "missing-cell" : ""
                                      }
                                    >
                                      {value || "Missing"}
                                    </td>
                                  );
                                })}
                              </tr>
                            )
                          )}

                        </tbody>

                      </table>
                    </div>

                    {/* COLUMN INSIGHTS */}
                    <section className="column-insights-section">

                      <div className="section-heading">
                        <h2>Column Insights</h2>

                        <span className="supported-format">
                          Automatic data type detection
                        </span>
                      </div>

                      <div className="column-insights-grid">

                        {columnProfiles.map((profile) => (
                          <div
                            className="column-insight-card"
                            key={profile.name}
                          >

                            <div className="column-insight-top">
                              <Database size={18} />

                              <span
                                className={`column-type ${profile.type.toLowerCase()}`}
                              >
                                {profile.type}
                              </span>
                            </div>

                            <h3>
                              {profile.name.replace(/_/g, " ")}
                            </h3>

                            <div className="column-insight-details">

                              <span>
                                Unique values
                                <strong>{profile.uniqueValues}</strong>
                              </span>

                              <span>
                                Non-empty
                                <strong>{profile.totalValues}</strong>
                              </span>

                            </div>
                          </div>
                        ))}

                      </div>
                    </section>

                  </>
                ) : (
                  <div className="chart-card empty-preview">
                    <Database size={30} />

                    <h3>No data to display</h3>

                    <p>
                      Go to Overview and upload a CSV file to explore
                      your dataset.
                    </p>

                    <button
                      className="upload-button"
                      onClick={() => navigateTo("overview")}
                    >
                      Go to Overview
                    </button>
                  </div>
                )}

              </section>

            </>
          )}

          {/* ==================================
              VISUALIZATIONS PAGE
          ================================== */}

          {activePage === "visualizations" && (
            <>

              <section className="welcome-section">
                <div>

                  <div className="welcome-label">
                    <BarChart3 size={14} />
                    DATA VISUALIZATION
                  </div>

                  <h1>
                    Discover data <span>patterns.</span>
                  </h1>

                  <p>
                    Visualize trends, distributions, correlations,
                    and unusual values in your dataset.
                  </p>

                </div>
              </section>

              {data.length > 0 ? (
                <>

                  {/* CHARTS */}
                  <section
                    id="visualizations"
                    className="visualizations-section"
                  >

                    <div className="section-heading">

                      <div>
                        <h2>Data Visualizations</h2>
                        <p>
                          Discover patterns and trends in your dataset.
                        </p>
                      </div>

                      <span className="live-badge">
                        INTERACTIVE CHARTS
                      </span>

                    </div>

                    <div className="charts-grid">

                      {/* AVERAGE SCORES */}
                      {scoreChartData.length > 0 && (
                        <div className="chart-card">

                          <div className="chart-heading">
                            <h3>Average Subject Scores</h3>
                            <span>
                              Average performance by subject
                            </span>
                          </div>

                          <div className="chart-container">

                            <ResponsiveContainer
                              width="100%"
                              height="100%"
                            >
                              <BarChart data={scoreChartData}>

                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#344B47"
                                  vertical={false}
                                />

                                <XAxis
                                  dataKey="subject"
                                  stroke="#9BAEAA"
                                  tick={{
                                    fill: "#9BAEAA",
                                    fontSize: 11,
                                  }}
                                />

                                <YAxis
                                  stroke="#9BAEAA"
                                  tick={{
                                    fill: "#9BAEAA",
                                    fontSize: 11,
                                  }}
                                />

                                <Tooltip
                                  contentStyle={{
                                    background: "#142324",
                                    border: "1px solid #47645D",
                                    borderRadius: "10px",
                                    color: "#F1F5F2",
                                  }}
                                />

                                <Bar
                                  dataKey="average"
                                  fill="#64D8B2"
                                  radius={[6, 6, 0, 0]}
                                />

                              </BarChart>
                            </ResponsiveContainer>

                          </div>
                        </div>
                      )}

                      {/* DEPARTMENT DISTRIBUTION */}
                      {departmentChartData.length > 0 && (
                        <div className="chart-card">

                          <div className="chart-heading">
                            <h3>Department Distribution</h3>
                            <span>Students by department</span>
                          </div>

                          <div className="chart-container">

                            <ResponsiveContainer
                              width="100%"
                              height="100%"
                            >
                              <PieChart>

                                <Pie
                                  data={departmentChartData}
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={95}
                                  innerRadius={55}
                                  paddingAngle={4}
                                  label
                                >

                                  {departmentChartData.map(
                                    (entry, index) => (
                                      <Cell
                                        key={entry.name}
                                        fill={
                                          chartColors[
                                            index % chartColors.length
                                          ]
                                        }
                                      />
                                    )
                                  )}

                                </Pie>

                                <Tooltip
                                  contentStyle={{
                                    background: "#142324",
                                    border: "1px solid #47645D",
                                    borderRadius: "10px",
                                    color: "#F1F5F2",
                                  }}
                                />

                                <Legend />

                              </PieChart>
                            </ResponsiveContainer>

                          </div>
                        </div>
                      )}

                      {/* GRADE DISTRIBUTION */}
                      {gradeChartData.length > 0 && (
                        <div className="chart-card grade-chart">

                          <div className="chart-heading">
                            <h3>Grade Distribution</h3>
                            <span>Students by grade</span>
                          </div>

                          <div className="chart-container">

                            <ResponsiveContainer
                              width="100%"
                              height="100%"
                            >
                              <BarChart data={gradeChartData}>

                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#344B47"
                                  vertical={false}
                                />

                                <XAxis
                                  dataKey="name"
                                  stroke="#9BAEAA"
                                  tick={{
                                    fill: "#9BAEAA",
                                    fontSize: 11,
                                  }}
                                />

                                <YAxis
                                  allowDecimals={false}
                                  stroke="#9BAEAA"
                                  tick={{
                                    fill: "#9BAEAA",
                                    fontSize: 11,
                                  }}
                                />

                                <Tooltip
                                  contentStyle={{
                                    background: "#142324",
                                    border: "1px solid #47645D",
                                    borderRadius: "10px",
                                    color: "#F1F5F2",
                                  }}
                                />

                                <Bar
                                  dataKey="value"
                                  name="Students"
                                  fill="#FF897A"
                                  radius={[6, 6, 0, 0]}
                                />

                              </BarChart>
                            </ResponsiveContainer>

                          </div>
                        </div>
                      )}

                    </div>
                  </section>

                  {/* CORRELATION ANALYSIS */}
                  {numericalColumns.length >= 2 && (
                    <section className="correlation-section">

                      <div className="section-heading">
                        <h2>Correlation Analysis</h2>

                        <span className="supported-format">
                          Pearson correlation heatmap
                        </span>
                      </div>

                      <div className="correlation-card">

                        <p className="correlation-description">
                          Explore relationships between numerical
                          columns. Values closer to +1 indicate positive
                          correlation, while values closer to -1 indicate
                          negative correlation.
                        </p>

                        <div className="correlation-heatmap">

                          <Plot
                            data={[
                              {
                                type: "heatmap",
                                x: numericalColumns.map(
                                  (column) => column.name
                                ),
                                y: numericalColumns.map(
                                  (column) => column.name
                                ),
                                z: correlationData.map((row) =>
                                  numericalColumns.map((column) =>
                                    Number(row[column.name])
                                  )
                                ),
                                zmin: -1,
                                zmax: 1,
                                colorscale: [
                                  [0, "#FF897A"],
                                  [0.5, "#203735"],
                                  [1, "#64D8B2"],
                                ],
                                showscale: true,
                                text: correlationData.map((row) =>
                                  numericalColumns.map((column) =>
                                    Number(row[column.name]).toFixed(2)
                                  )
                                ),
                                texttemplate: "%{text}",
                                hovertemplate:
                                  "%{y} vs %{x}<br>Correlation: %{z:.2f}<extra></extra>",
                              },
                            ]}
                            layout={{
                              autosize: true,
                              paper_bgcolor: "rgba(0,0,0,0)",
                              plot_bgcolor: "rgba(0,0,0,0)",
                              font: { color: "#F1F5F2" },
                              margin: {
                                l: 110,
                                r: 40,
                                t: 20,
                                b: 100,
                              },
                              xaxis: { tickangle: -35 },
                              yaxis: { autorange: "reversed" },
                            }}
                            config={{
                              responsive: true,
                              displaylogo: false,
                            }}
                            style={{
                              width: "100%",
                              height: "430px",
                            }}
                          />

                        </div>
                      </div>
                    </section>
                  )}

                  {/* OUTLIER DETECTION */}
                  {numericalColumns.length > 0 && (
                    <section className="outlier-section">

                      <div className="section-heading">
                        <h2>Outlier Detection</h2>

                        <span className="supported-format">
                          IQR Statistical Analysis
                        </span>
                      </div>

                      <div className="outlier-summary-grid">

                        <div className="outlier-summary-card">
                          <span>Columns Analyzed</span>
                          <h2>{outlierResults.length}</h2>
                        </div>

                        <div className="outlier-summary-card">
                          <span>Total Outliers</span>
                          <h2>
                            {outlierResults.reduce(
                              (sum, item) => sum + item.count,
                              0
                            )}
                          </h2>
                        </div>

                        <div className="outlier-summary-card">
                          <span>Columns with Outliers</span>
                          <h2>
                            {
                              outlierResults.filter(
                                (item) => item.count > 0
                              ).length
                            }
                          </h2>
                        </div>

                      </div>

                      <div className="outlier-table-card">

                        <h3>Outlier Report</h3>

                        <div className="outlier-table-wrapper">

                          <table>
                            <thead>
                              <tr>
                                <th>Column</th>
                                <th>Outlier Count</th>
                                <th>Lower Bound</th>
                                <th>Upper Bound</th>
                                <th>Detected Values</th>
                              </tr>
                            </thead>

                            <tbody>
                              {outlierResults.map((item) => (
                                <tr key={item.name}>
                                  <td>{item.name}</td>

                                  <td>
                                    <span className="outlier-count">
                                      {item.count}
                                    </span>
                                  </td>

                                  <td>
                                    {item.lowerBound.toFixed(2)}
                                  </td>

                                  <td>
                                    {item.upperBound.toFixed(2)}
                                  </td>

                                  <td>
                                    {item.values.length > 0
                                      ? item.values.join(", ")
                                      : "None"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                        </div>
                      </div>
                    </section>
                  )}

                  {/* COLUMN INSIGHTS */}
                  <section className="column-insights-section">

                    <div className="section-heading">
                      <h2>Column Insights</h2>

                      <span className="supported-format">
                        Automatic data type detection
                      </span>
                    </div>

                    <div className="column-insights-grid">

                      {columnProfiles.map((profile) => (
                        <div
                          className="column-insight-card"
                          key={profile.name}
                        >

                          <div className="column-insight-top">
                            <Database size={18} />

                            <span
                              className={`column-type ${profile.type.toLowerCase()}`}
                            >
                              {profile.type}
                            </span>
                          </div>

                          <h3>
                            {profile.name.replace(/_/g, " ")}
                          </h3>

                          <div className="column-insight-details">

                            <span>
                              Unique values
                              <strong>{profile.uniqueValues}</strong>
                            </span>

                            <span>
                              Non-empty
                              <strong>{profile.totalValues}</strong>
                            </span>

                          </div>
                        </div>
                      ))}

                    </div>
                  </section>

                </>
              ) : (
                <div className="chart-card empty-preview">
                  <BarChart3 size={30} />

                  <h3>No visualizations available</h3>

                  <p>
                    Upload a CSV file from Overview to generate charts
                    and statistical analysis.
                  </p>

                  <button
                    className="upload-button"
                    onClick={() => navigateTo("overview")}
                  >
                    Go to Overview
                  </button>
                </div>
              )}

            </>
          )}

          {/* ==================================
              DATA CLEANING PAGE
          ================================== */}

          {activePage === "cleaning" && (
            <>

              <section className="welcome-section">
                <div>

                  <div className="welcome-label">
                    <Sparkles size={14} />
                    DATA QUALITY MANAGEMENT
                  </div>

                  <h1>
                    Clean your <span>data.</span>
                  </h1>

                  <p>
                    Identify missing values, remove duplicate records,
                    and download your cleaned dataset.
                  </p>

                </div>
              </section>

              <section
                id="data-cleaning"
                className="data-cleaning-section"
              >

                <div className="section-heading">

                  <div>
                    <h2>Data Cleaning</h2>
                    <p>
                      Review missing values and duplicate records
                      in your dataset.
                    </p>
                  </div>

                  <span className="live-badge">
                    DATA QUALITY
                  </span>

                </div>

                <div className="chart-card cleaning-card">

                  {data.length > 0 ? (
                    <>

                      <h3>Data Quality Overview</h3>

                      <p>
                        Your dataset contains{" "}
                        <strong>{missingValues}</strong> missing values
                        and{" "}
                        <strong>{duplicateRows}</strong> duplicate rows.
                      </p>

                      <div className="cleaning-actions">

                        <button
                          className="cleaning-button"
                          onClick={removeDuplicates}
                          disabled={duplicateRows === 0}
                        >
                          <Sparkles size={16} />
                          Remove Duplicates
                        </button>

                        <button
                          className="cleaning-button"
                          onClick={handleMissingValues}
                          disabled={missingValues === 0}
                        >
                          <CheckCircle2 size={16} />
                          Replace Missing Values
                        </button>

                        <button
                          className="cleaning-button download-cleaning-button"
                          onClick={downloadCleanedCSV}
                        >
                          <Download size={16} />
                          Download Cleaned CSV
                        </button>

                      </div>

                      <div className="quality-metric">
                        <span>Current Quality Score</span>
                        <strong>{qualityScore}%</strong>
                      </div>

                      <div className="quality-metric">
                        <span>Total Records</span>
                        <strong>{data.length}</strong>
                      </div>

                    </>
                  ) : (
                    <>

                      <h3>No dataset available</h3>

                      <p>
                        Upload a CSV file to review and clean your data.
                      </p>

                      <button
                        className="upload-button"
                        onClick={() => navigateTo("overview")}
                      >
                        Go to Overview
                      </button>

                    </>
                  )}

                </div>

              </section>

            </>
          )}

          {/* ==================================
              FOOTER
          ================================== */}

          <footer className="dashboard-footer">

            <p>
              © 2026 DataLens. Turn your data into meaningful insights.
            </p>

            <span>
              Built with React · TypeScript · Recharts
            </span>

          </footer>

        </div>
      </main>
    </div>
  );
}

export default App;