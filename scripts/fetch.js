const FILES = {
    logs: 'mypeptideapp_peptide_logs.csv',
    metrics: 'mypeptideapp_health_metrics.csv'
};

async function loadAndRenderCSV(filename, containerId, columnsToShow, onDataLoaded = null) {
    try {
        const url = window.location.origin + '/' + filename;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        let text = await response.text();
        // Strip BOM (Byte Order Mark) if present
        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1);
        }
        const results = Papa.parse(text, {
            header: true,
            skipEmptyLines: true
        });
        console.log(`LOADED ${filename}:`, results.data.length, 'rows');
        console.log('HEADERS:', Object.keys(results.data[0] || {}));
        
        renderTable(results.data, containerId, columnsToShow);

        if (onDataLoaded) {
            onDataLoaded(results.data);
        }
    } catch (error) {
        document.getElementById(containerId).innerHTML =
            `<div class="error">Error loading ${filename}: ${error.message}</div>`;
    }
}

function renderTable(data, containerId, columnsToShow) {
    const container = document.getElementById(containerId);

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="loading">No data found in file.</p>';
        return;
    }
    let tableHtml = '<table><thead><tr>';

    columnsToShow.forEach(col => {
        tableHtml += `<th>${col}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';
    data.forEach(row => {
        tableHtml += '<tr>';
        columnsToShow.forEach(col => {
            const cellValue = row[col] !== undefined && row[col] !== "" ? row[col] : "-";
            tableHtml += `<td>${cellValue}</td>`;
        });
        tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table>';
    container.innerHTML = tableHtml;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatWeightValue(val) {
    if (!val) return '-';
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return num.toFixed(1);
}

function formatDoseValue(val) {
    if (!val) return '-';
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return num.toFixed(1);
}

function formatRelativeDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const now = new Date();
    const diffTime = now - d;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
}

function getTrendDirection(values) {
    if (values.length < 2) return 'flat';
    const first = values[0];
    const last = values[values.length - 1];
    const diff = last - first;
    if (Math.abs(diff) < 0.01) return 'flat';
    return diff < 0 ? 'down' : 'up';
}

function calcWeightTrend(data) {
    const weightRecords = data.filter(row => row["Metric Type"] === "Weight" && row["Value 1"]);
    if (weightRecords.length === 0) return null;
    weightRecords.sort((a, b) => new Date(b.Date) - new Date(a.Date));
    const values = weightRecords.map(r => parseFloat(r["Value 1"]) || 0);
    const trend = getTrendDirection(values);
    return { values, sortedValues: weightRecords.map(r => r.Date), trend, first: values[values.length - 1], last: values[0] };
}

function calcDoseProgression(data) {
    if (!data || data.length === 0) return null;
    const sorted = data.slice().sort((a, b) => new Date(a["Injection Date"]) - new Date(b["Injection Date"]));
    const items = sorted.map(row => ({
        date: row["Injection Date"],
        dose: parseFloat(row["Dose"]) || 0,
        unit: row["Unit"] || ''
    }));
    return items;
}

function calcWeeklyStats(data) {
    if (!data || data.length === 0) return null;
    const sorted = data.slice().sort((a, b) => new Date(a["Injection Date"]) - new Date(b["Injection Date"]));
    const weeks = {};
    sorted.forEach(row => {
        const d = new Date(row["Injection Date"]);
        const weekKey = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
        if (!weeks[weekKey]) weeks[weekKey] = { count: 0, totalDose: 0 };
        weeks[weekKey].count++;
        weeks[weekKey].totalDose += (parseFloat(row["Dose"]) || 0);
    });
    return Object.entries(weeks).map(([key, val]) => ({
        week: key,
        count: val.count,
        totalDose: val.totalDose.toFixed(1)
    }));
}

function calcHealthSummary(metricsData) {
    if (!metricsData || metricsData.length === 0) return null;
    const weightRecords = metricsData.filter(row => row["Metric Type"] === "Weight" && row["Value 1"]);
    if (weightRecords.length === 0) return null;
    weightRecords.sort((a, b) => new Date(a.Date) - new Date(b.Date));

    const firstWeight = parseFloat(weightRecords[0]["Value 1"]);
    const lastWeight = parseFloat(weightRecords[weightRecords.length - 1]["Value 1"]);
    const change = lastWeight - firstWeight;
    const pctChange = ((change / firstWeight) * 100).toFixed(1);

    const allMetrics = metricsData.map(row => row["Metric Type"]).filter(Boolean);
    const uniqueTypes = [...new Set(allMetrics)];

    return {
        totalWeightReadings: weightRecords.length,
        firstWeight: firstWeight.toFixed(1),
        lastWeight: lastWeight.toFixed(1),
        change: change.toFixed(1),
        pctChange: pctChange,
        metricTypes: uniqueTypes,
        dateRange: `${formatDate(weightRecords[0].Date)} - ${formatDate(weightRecords[weightRecords.length - 1].Date)}`
    };
}

function calcPainTracking(data) {
    if (!data || data.length === 0) return null;
    const sorted = data.slice().sort((a, b) => new Date(a["Injection Date"]) - new Date(b["Injection Date"]));
    return sorted.map(row => ({
        date: row["Injection Date"],
        pain: row["Pain Level"] ? parseInt(row["Pain Level"]) : null,
        note: row["Notes"] || ''
    }));
}

function getPainLevelClass(pain) {
    if (pain === null || pain === undefined) return 'low';
    if (pain <= 2) return 'low';
    if (pain <= 4) return 'medium';
    return 'high';
}

function getPainLabel(pain) {
    if (pain === null || pain === undefined) return '-';
    const labels = ['', 'Minimal', 'Low', 'Moderate', 'High', 'Severe'];
    return labels[pain] || '';
}

document.addEventListener("DOMContentLoaded", () => {
    const logColumns = ["Injection Date", "Peptide", "Dose", "Unit", "Injection Site"];
    loadAndRenderCSV(FILES.logs, "logs-container", logColumns, function(logData) {
        console.log("=== LOGS LOADED ===", logData.length, "rows");
        console.log("KEYS:", Object.keys(logData[0] || {}));
        console.log("SAMPLE DATA:", JSON.stringify(logData.slice(0, 2)));
        const container = document.getElementById('logs-container');
        if (!container) { console.error("CONTAINER MISSING"); return; }
        
        if (logData.length === 0) {
            container.innerHTML = '<p class="loading">No data found.</p>';
            return;
        }
        
        const doseProgression = calcDoseProgression(logData);
        console.log("DOSE ITEMS:", doseProgression ? doseProgression.length : 0, "items");
        console.log("SAMPLE DOSE:", JSON.stringify(doseProgression.slice(0, 2)));
        
        if (doseProgression && doseProgression.length > 0) {
            const latestFirst = doseProgression.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
            let html = '<table><thead><tr>';
            ["Injection Date", "Peptide", "Dose", "Unit", "Injection Site"].forEach(col => {
                html += `<th>${col}</th>`;
            });
            html += '</tr></thead><tbody>';
            latestFirst.forEach(row => {
                html += '<tr>';
                ["Injection Date", "Peptide", "Dose", "Unit", "Injection Site"].forEach(col => {
                    const val = row[col] !== undefined && row[col] !== "" ? row[col] : "-";
                    html += `<td>${val}</td>`;
                });
                html += '</tr>';
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p class="loading">No dose data found.</p>';
        }

        const painTracking = calcPainTracking(logData);
        if (painTracking && painTracking.length > 0) {
            const container = document.getElementById('metrics-container');
            let painHtml = '<h3>Pain Level Tracking</h3><div class="pain-track">';
            painTracking.forEach(item => {
                const painClass = getPainLevelClass(item.pain);
                const painLabel = getPainLabel(item.pain);
                const pct = item.pain !== null ? (item.pain / 5) * 100 : 0;
                painHtml += `<div class="pain-track-item">
                    <div class="pain-date">${formatDate(item.date)}</div>
                    <div class="pain-bar-track">
                        <div class="pain-bar-fill ${painClass}" style="width: ${pct}%"></div>
                    </div>
                    <div class="pain-level-text">${painLabel}</div>
                    ${item.note ? `<div class="pain-note">${item.note}</div>` : ''}
                </div>`;
            });
            painHtml += '</div>';
            container.innerHTML = painHtml;
        }

        const weeklyStats = calcWeeklyStats(logData);
        if (weeklyStats && weeklyStats.length > 0) {
            const container = document.getElementById('metrics-container');
            let weeklyHtml = '<h3>Weekly Injection Summary</h3>';
            weeklyStats.forEach(ws => {
                weeklyHtml += `<div class="chart-bar-container">
                    <div class="chart-bar-label">${ws.week}</div>
                    <div class="chart-bar-track">
                        <div class="chart-bar-fill dose" style="width: ${(ws.count / Math.max(weeklyStats.length, 1) * 100).toFixed(0)}%"></div>
                    </div>
                </div>`;
            });
            weeklyHtml += '<table><thead><tr><th>Week</th><th>Injections</th><th>Total Dose</th></tr></thead><tbody>';
            weeklyStats.forEach(ws => {
                weeklyHtml += `<tr><td>${ws.week}</td><td>${ws.count}</td><td>${ws.totalDose} mg</td></tr>`;
            });
            weeklyHtml += '</tbody></table>';
            container.innerHTML = weeklyHtml;
        }
    });

    // Weight trend line chart
    loadAndRenderCSV(FILES.metrics, "weight-trend-container", null, function(data) {
        const container = document.getElementById('weight-trend-container');
        const weightRecords = data.filter(row => row["Metric Type"] === "Weight" && row["Value 1"]);
        
        if (weightRecords.length === 0) {
            container.innerHTML = '<p class="loading">No weight data found.</p>';
            return;
        }
        
        // Sort by date ascending for line chart
        weightRecords.sort((a, b) => new Date(a.Date) - new Date(b.Date));
        const values = weightRecords.map(r => parseFloat(r["Value 1"]) || 0);
        const dates = weightRecords.map(r => r.Date);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const padding = (maxVal - minVal) * 0.1;
        const chartMin = Math.max(0, minVal - padding);
        const chartMax = maxVal + padding;
        const range = chartMax - chartMin || 1;
        
        const width = container.clientWidth || 600;
        const height = 250;
        const paddingX = 60;
        const paddingY = 40;
        const chartWidth = width - paddingX * 2;
        const chartHeight = height - paddingY * 2;
        
        let svgHtml = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(${paddingX}, ${paddingY})">
                <!-- Grid lines and Y-axis labels -->
                ${Array.from({length: 5}, (_, i) => {
                    const y = chartHeight - (i / 4) * chartHeight;
                    const val = chartMin + (i / 4) * range;
                    return `<g>
                        <line x1="0" y1="${y}" x2="${chartWidth}" y2="${y}" stroke="var(--border-color)" stroke-width="1" stroke-dasharray="3,3"/>
                        <text x="-10" y="${y + 4}" text-anchor="end" font-size="12" fill="var(--text-muted)">${val.toFixed(1)}</text>
                    </g>`;
                }).join('')}
                
                <!-- X-axis labels -->
                ${dates.map((date, i) => {
                    const x = (i / (dates.length - 1 || 1)) * chartWidth;
                    return `<g transform="translate(${x}, ${chartHeight})">
                        <text y="14" text-anchor="middle" font-size="11" fill="var(--text-muted)">${formatDate(date)}</text>
                    </g>`;
                }).join('')}
                
                <!-- Line path -->
                <polyline points="${dates.map((date, i) => {
                    const x = (i / (dates.length - 1 || 1)) * chartWidth;
                    const y = chartHeight - ((values[i] - chartMin) / range) * chartHeight;
                    return `${x},${y}`;
                }).join(' ')}" fill="none" stroke="var(--accent-blue)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                
                <!-- Data points -->
                ${dates.map((date, i) => {
                    const x = (i / (dates.length - 1 || 1)) * chartWidth;
                    const y = chartHeight - ((values[i] - chartMin) / range) * chartHeight;
                    return `<circle cx="${x}" cy="${y}" r="5" fill="var(--accent-blue)" stroke="white" stroke-width="2"/>`;
                }).join('')}
            </g>
        </svg>`;
        
        container.innerHTML = `<div class="weight-chart-container">${svgHtml}</div>`;
    });

    const metricColumns = ["Date", "Metric Type", "Value 1", "Unit"];
    loadAndRenderCSV(FILES.metrics, "metrics-container", metricColumns, function(data) {
        const weightTrend = calcWeightTrend(data);
        const healthSummary = calcHealthSummary(data);

        if (weightTrend && weightTrend.values.length > 0) {
            const container = document.getElementById('latest-weight');
            let html = `${weightTrend.last} <span>${weightTrend.values[0] ? 'kg' : ''}</span>`;
            const trendClass = weightTrend.trend === 'down' ? 'down' : weightTrend.trend === 'up' ? 'up' : 'flat';
            html += `<div class="trend-indicator ${trendClass}">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 12l-4-4h2.5V3h3v5H12L8 12z"/>
                </svg>
                ${weightTrend.trend === 'down' ? 'Weight ↓' : weightTrend.trend === 'up' ? 'Weight ↑' : 'Stable'}
            </div>`;
            container.innerHTML = html;
        } else {
            document.getElementById('latest-weight').innerHTML = `N/A`;
        }

        if (healthSummary) {
            const grid = document.createElement('div');
            grid.className = 'summary-grid';

            grid.innerHTML += `<div class="summary-card">
                <div class="summary-label">Total Readings</div>
                <div class="summary-value">${healthSummary.totalWeightReadings}</div>
                <div class="summary-sub">Weight measurements</div>
            </div>`;

            grid.innerHTML += `<div class="summary-card">
                <div class="summary-label">First Reading</div>
                <div class="summary-value">${healthSummary.firstWeight} <span>kg</span></div>
                <div class="summary-sub">${healthSummary.dateRange}</div>
            </div>`;

            grid.innerHTML += `<div class="summary-card">
                <div class="summary-label">Latest</div>
                <div class="summary-value">${healthSummary.lastWeight} <span>kg</span></div>
                <div class="summary-sub">${healthSummary.dateRange}</div>
            </div>`;

            grid.innerHTML += `<div class="summary-card">
                <div class="summary-label">Change</div>
                <div class="summary-value" style="color: ${healthSummary.change <= 0 ? 'var(--trend-up)' : 'var(--trend-down)'}">${healthSummary.change} <span>kg</span></div>
                <div class="summary-sub">${healthSummary.pctChange}% over ${healthSummary.totalWeightReadings} readings</div>
            </div>`;

            document.querySelector('.hero-stat-container').parentElement.insertBefore(grid, document.querySelector('.card'));
        }
    });

});
