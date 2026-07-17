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
        
        if (columnsToShow) {
            renderTable(results.data, containerId, columnsToShow);
        }

        if (onDataLoaded) {
            onDataLoaded(results.data);
        }
    } catch (error) {
        document.getElementById(containerId).innerHTML =
            `<div class="error">Error loading ${filename}: ${error.message}</div>`;
    }
}

function renderTable(data, containerId, columnsToShow, pagination = null) {
    const container = document.getElementById(containerId);

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="loading">No data found in file.</p>';
        return;
    }
    
    // Use provided columns or show all available columns
    const cols = columnsToShow || Object.keys(data[0]);
    
    let tableHtml = '<table><thead><tr>';

    cols.forEach(col => {
        tableHtml += `<th>${col}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';
    
    const rowsToShow = pagination ? data.slice(pagination.startIndex, pagination.endIndex) : data;
    
    rowsToShow.forEach(row => {
        tableHtml += '<tr>';
        cols.forEach(col => {
            const cellValue = row[col] !== undefined && row[col] !== "" ? row[col] : "-";
            tableHtml += `<td>${cellValue}</td>`;
        });
        tableHtml += '</tr>';
    });
    
    tableHtml += '</tbody></table>';
    container.innerHTML = tableHtml;
    
    if (pagination && pagination.totalPages > 1) {
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'pagination';
        
        const updateTable = (page) => {
            const newPagination = createPagination(data.length, page, 5);
            container.innerHTML = renderTable(data, containerId, columnsToShow, newPagination);
            renderPagination(container, newPagination, updateTable);
        };
        
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.textContent = '← Prev';
        prevBtn.disabled = !pagination.hasPrev;
        prevBtn.onclick = (e) => {
            e.stopPropagation();
            updateTable(pagination.currentPage - 1);
        };
        
        const pageInfo = document.createElement('span');
        pageInfo.className = 'page-info';
        pageInfo.textContent = `Page ${pagination.currentPage} of ${pagination.totalPages}`;
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.textContent = 'Next →';
        nextBtn.disabled = !pagination.hasNext;
        nextBtn.onclick = (e) => {
            e.stopPropagation();
            updateTable(pagination.currentPage + 1);
        };
        
        paginationDiv.appendChild(prevBtn);
        paginationDiv.appendChild(pageInfo);
        paginationDiv.appendChild(nextBtn);
        container.appendChild(paginationDiv);
    }
}

function createPagination(totalRows, currentPage, rowsPerPage) {
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
    return {
        currentPage,
        totalPages,
        startIndex,
        endIndex,
        hasPrev: currentPage > 1,
        hasNext: currentPage < totalPages,
        goToPage: (page) => createPagination(totalRows, page, rowsPerPage)
    };
}

function renderPagination(container, pagination, onPageChange) {
    if (pagination.totalPages <= 1) return;

    const nav = document.createElement('div');
    nav.className = 'pagination';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.textContent = '← Prev';
    prevBtn.disabled = !pagination.hasPrev;
    prevBtn.onclick = (e) => {
        e.stopPropagation();
        onPageChange(pagination.currentPage - 1);
    };
    nav.appendChild(prevBtn);

    const pageInfo = document.createElement('span');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${pagination.currentPage} of ${pagination.totalPages}`;
    nav.appendChild(pageInfo);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = !pagination.hasNext;
    nextBtn.onclick = (e) => {
        e.stopPropagation();
        onPageChange(pagination.currentPage + 1);
    };
    nav.appendChild(nextBtn);

    container.appendChild(nav);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// function formatWeightValue(val) {
//     if (!val) return '-';
//     const num = parseFloat(val);
//     if (isNaN(num)) return val;
//     return num.toFixed(1);
// }

// function formatDoseValue(val) {
//     if (!val) return '-';
//     const num = parseFloat(val);
//     if (isNaN(num)) return val;
//     return num.toFixed(1);
// }

// function formatRelativeDate(dateStr) {
//     if (!dateStr) return '-';
//     const d = new Date(dateStr);
//     const now = new Date();
//     const diffTime = now - d;
//     const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

//     if (diffDays === 0) return 'today';
//     if (diffDays === 1) return 'yesterday';
//     if (diffDays < 7) return `${diffDays} days ago`;
//     if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
//     return `${Math.floor(diffDays / 30)}mo ago`;
// }

function getTrendDirection(values) {
    if (values.length < 2) return 'flat';
    const first = values[values.length - 1];
    const last = values[0];
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

// function calcWeeklyStats(data) {
//     if (!data || data.length === 0) return null;
//     const sorted = data.slice().sort((a, b) => new Date(a["Injection Date"]) - new Date(b["Injection Date"]));
//     const weeks = {};
//     sorted.forEach(row => {
//         const d = new Date(row["Injection Date"]);
//         const weekKey = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
//         if (!weeks[weekKey]) weeks[weekKey] = { count: 0, totalDose: 0 };
//         weeks[weekKey].count++;
//         weeks[weekKey].totalDose += (parseFloat(row["Dose"]) || 0);
//     });
//     return Object.entries(weeks).map(([key, val]) => ({
//         week: key,
//         count: val.count,
//         totalDose: val.totalDose.toFixed(1)
//     }));
// }


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

    const prevRecord = weightRecords.length >= 2 ? weightRecords[weightRecords.length - 2] : null;

    return {
        totalWeightReadings: weightRecords.length,
        firstWeight: firstWeight.toFixed(1),
        firstDate: formatDate(weightRecords[0].Date),
        lastWeight: lastWeight.toFixed(1),
        lastDate: formatDate(weightRecords[weightRecords.length - 1].Date),
        change: change.toFixed(1),
        pctChange: pctChange,
        metricTypes: uniqueTypes,
        prevWeight: prevRecord ? parseFloat(prevRecord["Value 1"]).toFixed(1) : null,
        prevDate: prevRecord ? formatDate(prevRecord.Date) : null,
    };
}

// function calcPainTracking(data) {
//     if (!data || data.length === 0) return null;
//     const sorted = data.slice().sort((a, b) => new Date(a["Injection Date"]) - new Date(b["Injection Date"]));
//     return sorted.map(row => ({
//         date: row["Injection Date"],
//         pain: row["Pain Level"] ? parseInt(row["Pain Level"]) : null,
//         note: row["Notes"] || ''
//     }));
// }

// function getPainLevelClass(pain) {
//     if (pain === null || pain === undefined) return 'low';
//     if (pain <= 2) return 'low';
//     if (pain <= 4) return 'medium';
//     return 'high';
// }

// function getPainLabel(pain) {
//     if (pain === null || pain === undefined) return '-';
//     const labels = ['', 'Minimal', 'Low', 'Moderate', 'High', 'Severe'];
//     return labels[pain] || '';
// }

document.addEventListener("DOMContentLoaded", () => {
    const logColumns = ["Injection Date", "Peptide", "Dose", "Unit", "Injection Site"];
    loadAndRenderCSV(FILES.logs, "logs-container", logColumns, function(logData) {
        const container = document.getElementById('logs-container');
        if (!container) return;
        
        if (logData.length === 0) {
            container.innerHTML = '<p class="loading">No data found.</p>';
            return;
        }
        
        if (logData && logData.length > 0) {
            const latestFirst = logData.slice().sort((a, b) => new Date(b["Injection Date"]) - new Date(a["Injection Date"]));
            
            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const trHead = document.createElement('tr');
            
            ["Injection Date", "Peptide", "Dose", "Unit", "Injection Site"].forEach(col => {
                const th = document.createElement('th');
                th.textContent = col;
                trHead.appendChild(th);
            });
            thead.appendChild(trHead);
            table.appendChild(thead);
            
            const tbody = document.createElement('tbody');
            const pagination = createPagination(latestFirst.length, 1, 5);
            
            latestFirst.slice(pagination.startIndex, pagination.endIndex).forEach(row => {
                const tr = document.createElement('tr');
                ["Injection Date", "Peptide", "Dose", "Unit", "Injection Site"].forEach(col => {
                    const td = document.createElement('td');
                    td.textContent = row[col] !== undefined && row[col] !== "" ? row[col] : "-";
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            
            container.innerHTML = '';
            container.appendChild(table);
            
            const updateTable = (page) => {
                const newPagination = createPagination(latestFirst.length, page, 5);
                tbody.innerHTML = '';
                latestFirst.slice(newPagination.startIndex, newPagination.endIndex).forEach(row => {
                    const tr = document.createElement('tr');
                    ["Injection Date", "Peptide", "Dose", "Unit", "Injection Site"].forEach(col => {
                        const td = document.createElement('td');
                        td.textContent = row[col] !== undefined && row[col] !== "" ? row[col] : "-";
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });
                renderPagination(container, newPagination, updateTable);
            };
            
            updateTable(1);
        } else {
            container.innerHTML = '<p class="loading">No dose data found.</p>';
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
        const pagination = createPagination(data.length, 1, 5);
        
        const updateMetricsTable = (page) => {
            const newPagination = createPagination(data.length, page, 5);
            renderTable(data, "metrics-container", metricColumns, newPagination);
            renderPagination(document.getElementById("metrics-container"), newPagination, updateMetricsTable);
        };
        
        updateMetricsTable(1);
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
                <div class="summary-sub">${healthSummary.firstDate}</div>
            </div>`;

            const recentDiff = healthSummary.prevWeight !== null
                ? (parseFloat(healthSummary.lastWeight) - parseFloat(healthSummary.prevWeight)).toFixed(1)
                : null;
            const recentDiffColor = recentDiff !== null && parseFloat(recentDiff) <= 0
                ? 'var(--trend-down)'
                : 'var(--trend-up)';

            grid.innerHTML += `<div class="summary-card">
                <div class="summary-label">Since Last Weigh-in</div>
                <div class="summary-value" style="color: ${recentDiffColor}">${recentDiff !== null ? recentDiff : 'N/A'} <span>kg</span></div>
                <div class="summary-sub">${healthSummary.prevDate} → ${healthSummary.lastDate}</div>
            </div>`;

            grid.innerHTML += `<div class="summary-card">
                <div class="summary-label">Change</div>
                <div class="summary-value" style="color: ${healthSummary.change <= 0 ? 'var(--trend-down)' : 'var(--trend-up)'}">${healthSummary.change} <span>kg</span></div>
                <div class="summary-sub">${healthSummary.pctChange}% · ${healthSummary.firstDate} → ${healthSummary.lastDate}</div>
            </div>`;

            document.querySelector('.hero-stat-container').parentElement.insertBefore(grid, document.querySelector('.card'));
        }
    });

});
