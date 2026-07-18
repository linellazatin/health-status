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

function renderTable(data, containerId, columnsToShow, startIndex, endIndex) {
    const container = document.getElementById(containerId);

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="loading">No data found in file.</p>';
        return;
    }
    
    // Use provided columns or show all available columns
    const cols = columnsToShow || Object.keys(data[0]);
    const rowsToShow = (startIndex !== undefined) ? data.slice(startIndex, endIndex) : data;
    
    let tableHtml = '<table><thead><tr>';
    cols.forEach(col => { tableHtml += `<th>${col}</th>`; });
    tableHtml += '</tr></thead><tbody>';
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
}

function renderPaginatedTable(data, containerId, columnsToShow, initialPage) {
    const ROWS_PER_PAGE = 5;
    const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);

    function goToPage(page) {
        const startIndex = (page - 1) * ROWS_PER_PAGE;
        const endIndex = Math.min(startIndex + ROWS_PER_PAGE, data.length);

        renderTable(data, containerId, columnsToShow, startIndex, endIndex);

        if (totalPages <= 1) return;

        const container = document.getElementById(containerId);
        const nav = document.createElement('div');
        nav.className = 'pagination';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.textContent = '← Prev';
        prevBtn.disabled = page <= 1;
        prevBtn.onclick = () => goToPage(page - 1);

        const pageInfo = document.createElement('span');
        pageInfo.className = 'page-info';
        pageInfo.textContent = `Page ${page} of ${totalPages}`;

        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.textContent = 'Next →';
        nextBtn.disabled = page >= totalPages;
        nextBtn.onclick = () => goToPage(page + 1);

        nav.appendChild(prevBtn);
        nav.appendChild(pageInfo);
        nav.appendChild(nextBtn);
        container.appendChild(nav);
    }

    goToPage(initialPage);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

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
    return { values, trend, first: values[values.length - 1], last: values[0] };
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

    const prevRecord = weightRecords.length >= 2 ? weightRecords[weightRecords.length - 2] : null;

    return {
        totalWeightReadings: weightRecords.length,
        firstWeight: firstWeight.toFixed(1),
        firstDate: formatDate(weightRecords[0].Date),
        lastWeight: lastWeight.toFixed(1),
        lastDate: formatDate(weightRecords[weightRecords.length - 1].Date),
        change: change.toFixed(1),
        pctChange: pctChange,
        prevWeight: prevRecord ? parseFloat(prevRecord["Value 1"]).toFixed(1) : null,
        prevDate: prevRecord ? formatDate(prevRecord.Date) : null,
    };
}

document.addEventListener("DOMContentLoaded", () => {
    const logColumns = ["Injection Date", "Peptide", "Dose", "Injection Site"];
    loadAndRenderCSV(FILES.logs, "logs-container", null, function(logData) {
        if (!logData || logData.length === 0) {
            document.getElementById('logs-container').innerHTML = '<p class="loading">No data found.</p>';
            return;
        }
        const latestFirst = logData.slice()
            .sort((a, b) => new Date(b["Injection Date"]) - new Date(a["Injection Date"]))
            .map(row => ({ ...row, Dose: `${row.Dose} ${row.Unit}`.trim() }));
        renderPaginatedTable(latestFirst, "logs-container", logColumns, 1);
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
                    return `<circle cx="${x}" cy="${y}" r="5" fill="var(--accent-blue)" stroke="white" stroke-width="2" data-value="${values[i]}"/>`;
                }).join('')}
            </g>
        </svg>`;
        
        // Clear existing content
        container.innerHTML = '';
        
        const chartContainer = document.createElement('div');
        chartContainer.className = 'weight-chart-container';
        
        // Add tooltip element, appended to body on mouseenter for proper positioning
        const tooltip = document.createElement('div');
        tooltip.className = 'chart-tooltip';
        chartContainer.innerHTML = svgHtml;
        
        // Add hover events to data points
        chartContainer.querySelectorAll('circle').forEach((circle, i) => {
            const value = values[i];
            
            circle.addEventListener('mouseenter', (e) => {
                document.body.appendChild(tooltip);
                tooltip.style.left = (e.clientX + 10) + 'px';
                tooltip.style.top = (e.clientY - 10) + 'px';
                tooltip.textContent = `${value} kg\n${formatDate(dates[i])}`;
                tooltip.classList.add('visible');
            });
            
            circle.addEventListener('mousemove', (e) => {
                tooltip.style.left = (e.clientX + 10) + 'px';
                tooltip.style.top = (e.clientY - 10) + 'px';
            });
            
            circle.addEventListener('mouseleave', () => {
                tooltip.classList.remove('visible');
                tooltip.remove();
            });
        });
        
        container.appendChild(chartContainer);
    });

    const metricColumns = ["Date", "Metric Type", "Value"];
    loadAndRenderCSV(FILES.metrics, "metrics-container", null, function(data) {
        const displayData = data.map(row => ({
            ...row,
            Date: row.Date ? row.Date.split(' ')[0] : row.Date,
            Value: `${row["Value 1"]} ${row.Unit}`.trim()
        }));
        renderPaginatedTable(displayData, "metrics-container", metricColumns, 1);
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
