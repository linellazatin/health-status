// Health Dashboard Data Loading
// Ponytail: minimal functional enhancements

let lastUpdatedTime = null;

async function loadAndRenderCSV(filename, containerId, onDataLoaded = null) {
    try {
        const url = window.location.origin + '/' + filename;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load ${filename}: ${response.status} ${response.statusText}`);
        }
        
        lastUpdatedTime = new Date();
        updateLastUpdatedUI();
        
        let text = await response.text();
        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1);
        }
        const results = Papa.parse(text, {
            header: true,
            skipEmptyLines: true
        });
        if (onDataLoaded) {
            onDataLoaded(results.data);
        }
    } catch (error) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = renderErrorState(error.message);
        }
    }
}

function renderErrorState(message) {
    return `
        <div class="ol-empty-state">
            <div class="ol-empty-state__icon">!</div>
            <div class="ol-empty-state__title">Unable to load data</div>
            <div class="ol-empty-state__message">${escapeHtml(message)}</div>
            <button onclick="location.reload()" class="ol-pagination__btn" style="margin-top: 16px;">Retry</button>
        </div>
    `;
}

function renderEmptyState(title = "No records", message = "This section has no data yet.") {
    return `
        <div class="ol-empty-state">
            <div class="ol-empty-state__icon">—</div>
            <div class="ol-empty-state__title">${escapeHtml(title)}</div>
            <div class="ol-empty-state__message">${escapeHtml(message)}</div>
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateLastUpdatedUI() {
    const footer = document.querySelector('.ol-footer__inner');
    if (!footer || !lastUpdatedTime) return;
    
    let timestampEl = footer.querySelector('.ol-timestamp');
    if (!timestampEl) {
        timestampEl = document.createElement('span');
        timestampEl.className = 'ol-timestamp';
        footer.insertBefore(timestampEl, footer.firstChild);
    }
    
    const timeStr = lastUpdatedTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    timestampEl.textContent = `Updated ${timeStr}`;
}

function renderPaginatedTable(data, containerId, columnsToShow, initialPage) {
    const ROWS_PER_PAGE = 5;
    const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);
    let currentPage = initialPage;

    function goToPage(page) {
        currentPage = page;
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const startIndex = (page - 1) * ROWS_PER_PAGE;
        const endIndex = Math.min(startIndex + ROWS_PER_PAGE, data.length);
        const rowsToShow = data.slice(startIndex, endIndex);

        if (!data || data.length === 0) {
            container.innerHTML = renderEmptyState();
            return;
        }

        const cols = columnsToShow || Object.keys(data[0]);
        let tableHtml = '<div class="table-container"><table class="ol-table"><thead><tr>';
        cols.forEach(col => {
            tableHtml += `<th scope="col">${escapeHtml(col)}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';
        rowsToShow.forEach(row => {
            tableHtml += '<tr>';
            cols.forEach(col => {
                const cellValue = row[col] !== undefined && row[col] !== "" ? row[col] : "—";
                tableHtml += `<td>${escapeHtml(String(cellValue))}</td>`;
            });
            tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table></div>';
        container.innerHTML = tableHtml;

        if (totalPages <= 1) return;

        const nav = document.createElement('div');
        nav.className = 'ol-pagination';
        nav.setAttribute('role', 'navigation');
        nav.setAttribute('aria-label', 'Table pagination');
        nav.setAttribute('tabindex', '0');

        const prevBtn = document.createElement('button');
        prevBtn.className = 'ol-pagination__btn';
        prevBtn.textContent = '← Prev';
        prevBtn.disabled = page <= 1;
        prevBtn.onclick = () => goToPage(page - 1);
        prevBtn.setAttribute('aria-label', 'Previous page');

        const pageInfo = document.createElement('span');
        pageInfo.className = 'ol-pagination__info';
        pageInfo.textContent = `Page ${page} of ${totalPages}`;
        pageInfo.setAttribute('aria-live', 'polite');

        const nextBtn = document.createElement('button');
        nextBtn.className = 'ol-pagination__btn';
        nextBtn.textContent = 'Next →';
        nextBtn.disabled = page >= totalPages;
        nextBtn.onclick = () => goToPage(page + 1);
        nextBtn.setAttribute('aria-label', 'Next page');

        nav.appendChild(prevBtn);
        nav.appendChild(pageInfo);
        nav.appendChild(nextBtn);
        
        // Keyboard navigation
        nav.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && currentPage > 1) {
                e.preventDefault();
                goToPage(currentPage - 1);
            } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
                e.preventDefault();
                goToPage(currentPage + 1);
            }
        });
        
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

function calcWeightTrend(data) {
    const weightRecords = data.filter(row => row["Metric Type"] === "Weight" && row["Value 1"]);
    if (weightRecords.length === 0) return null;
    weightRecords.sort((a, b) => new Date(b.Date) - new Date(a.Date));
    const values = weightRecords.map(r => parseFloat(r["Value 1"]) || 0);
    const first = values[values.length - 1];
    const recent = values[1];
    const last = values[0];
    const diff = last - recent;
    const trend = values.length < 2 || Math.abs(diff) < 0.01 ? 'flat' : diff < 0 ? 'down' : 'up';
    return { values, trend, first, last };
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

function getTrendElement(trend, values) {
    const trendConfig = {
        down: { class: 'down', dot: 'ol-dot--green' },
        up: { class: 'up', dot: 'ol-dot--orange' },
        flat: { class: 'flat', dot: 'ol-dot--yellow' }
    };
    const config = trendConfig[trend];
    return `<div class="trend-indicator ${config.class}">
        <span class="ol-dot ${config.dot}"></span>
        ${trend === 'down' ? 'Weight ↓' : trend === 'up' ? 'Weight ↑' : 'Stable'}
    </div>`;
}

// Ponytail: tooltip positioning with viewport clamping
function positionTooltip(tooltip, clientX, clientY) {
    const tooltipWidth = tooltip.offsetWidth || 100;
    const tooltipHeight = tooltip.offsetHeight || 40;
    const padding = 10;
    
    let left = clientX + padding;
    let top = clientY - tooltipHeight - padding;
    
    // Clamp to viewport
    if (left + tooltipWidth > window.innerWidth) {
        left = clientX - tooltipWidth - padding;
    }
    if (top < 0) {
        top = clientY + padding;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
}

document.addEventListener("DOMContentLoaded", () => {
    loadAndRenderCSV('mypeptideapp_peptide_logs.csv', "logs-container", function(logData) {
        if (!logData || logData.length === 0) {
            document.getElementById('logs-container').innerHTML = renderEmptyState(
                "No injection logs",
                "Your peptide injection records will appear here."
            );
            return;
        }
        const latestFirst = logData.slice()
            .sort((a, b) => new Date(b["Injection Date"]) - new Date(a["Injection Date"]))
            .map(row => ({ ...row, Date: row["Injection Date"], Dose: `${row.Dose} ${row.Unit}`.trim() }));
        renderPaginatedTable(latestFirst, "logs-container", ["Date", "Peptide", "Dose", "Injection Site"], 1);
    });

    loadAndRenderCSV('mypeptideapp_health_metrics.csv', "weight-trend-container", function(data) {
        const container = document.getElementById('weight-trend-container');
        const weightRecords = data.filter(row => row["Metric Type"] === "Weight" && row["Value 1"]);
        
        if (weightRecords.length === 0) {
            container.innerHTML = renderEmptyState(
                "No weight data",
                "Weight measurements will appear here when available."
            );
            return;
        }
        
        weightRecords.sort((a, b) => new Date(a.Date) - new Date(b.Date));
        const values = weightRecords.map(r => parseFloat(r["Value 1"]) || 0);
        const dates = weightRecords.map(r => r.Date);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const padding = (maxVal - minVal) * 0.1;
        const chartMin = Math.max(0, minVal - padding);
        const chartMax = maxVal + padding;
        const range = chartMax - chartMin || 1;
        
        const width = Math.min(container.clientWidth || 600, 800);
        const height = 250;
        const paddingX = 60;
        const paddingY = 40;
        const chartWidth = width - paddingX * 2;
        const chartHeight = height - paddingY * 2;
        
        const trend = values.length >= 2 && values[values.length - 1] < values[0] ? 'down' : 'up';
        const strokeColor = trend === 'down' ? '#6fae6b' : '#e2712b';
        
        let svgHtml = '<svg width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '" xmlns="http://www.w3.org/2000/svg">' +
            '<g transform="translate(' + paddingX + ', ' + paddingY + ')">' +
            Array.from({length: 5}, (_, i) => {
                const y = chartHeight - (i / 4) * chartHeight;
                const val = chartMin + (i / 4) * range;
                return '<g>' +
                    '<line x1="0" y1="' + y + '" x2="' + chartWidth + '" y2="' + y + '" stroke="#2b2a24" stroke-width="1" stroke-dasharray="3,3"/>' +
                    '<text x="-10" y="' + (y + 4) + '" text-anchor="end" font-size="11" fill="#8c8a7d" font-family="Fira Code, monospace">' + val.toFixed(1) + '</text>' +
                '</g>';
            }).join('') +
            '<polyline points="' + dates.map((date, i) => {
                const x = (i / (dates.length - 1 || 1)) * chartWidth;
                const y = chartHeight - ((values[i] - chartMin) / range) * chartHeight;
                return x + ',' + y;
            }).join(' ') + '" fill="none" stroke="' + strokeColor + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
            dates.map((date, i) => {
                const x = (i / (dates.length - 1 || 1)) * chartWidth;
                const y = chartHeight - ((values[i] - chartMin) / range) * chartHeight;
                const color = i === 0 ? '#e2712b' : i === dates.length - 1 ? '#6fae6b' : '#e8c14a';
                return '<circle cx="' + x + '" cy="' + y + '" r="4" fill="' + color + '" stroke="#0d0d0b" stroke-width="2" data-value="' + values[i] + '" style="cursor: pointer;"/>';
            }).join('') +
            '</g></svg>';
        
        container.innerHTML = '';
        
        const chartContainer = document.createElement('div');
        chartContainer.className = 'weight-chart-container';
        
        const tooltip = document.createElement('div');
        tooltip.className = 'chart-tooltip';
        chartContainer.innerHTML = svgHtml;
        
        chartContainer.querySelectorAll('circle').forEach((circle, i) => {
            const value = values[i];
            const dateStr = formatDate(dates[i]);
            
            const showTooltip = (e) => {
                const clientX = e.clientX || (circle.getBoundingClientRect().left + 20);
                const clientY = e.clientY || (circle.getBoundingClientRect().top - 40);
                tooltip.textContent = value + ' kg\n' + dateStr;
                tooltip.classList.add('visible');
                document.body.appendChild(tooltip);
                positionTooltip(tooltip, clientX, clientY);
            };
            const hideTooltip = () => {
                tooltip.classList.remove('visible');
                tooltip.remove();
            };
            
            // Mouse events
            circle.addEventListener('mouseenter', showTooltip);
            circle.addEventListener('mousemove', (e) => positionTooltip(tooltip, e.clientX, e.clientY));
            circle.addEventListener('mouseleave', hideTooltip);
            
            // Keyboard support
            circle.addEventListener('focus', showTooltip);
            circle.addEventListener('blur', hideTooltip);
            circle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    tooltip.classList.contains('visible') ? hideTooltip() : showTooltip(e);
                }
            });
        });
        
        container.appendChild(chartContainer);
    });

    loadAndRenderCSV('mypeptideapp_health_metrics.csv', "metrics-container", function(data) {
        const displayData = data.map(row => ({
            ...row,
            Date: row.Date ? row.Date.split(' ')[0] : row.Date,
            Value: `${row["Value 1"]} ${row.Unit}`.trim()
        }));
        renderPaginatedTable(displayData, "metrics-container", ["Date", "Metric Type", "Value"], 1);
        
        const weightTrend = calcWeightTrend(data);
        const healthSummary = calcHealthSummary(data);

        if (weightTrend && weightTrend.values.length > 0) {
            const container = document.getElementById('latest-weight');
            container.innerHTML = `${weightTrend.last} <span>kg</span>`;
            
            const trendEl = document.getElementById('trend-indicator');
            if (trendEl) {
                trendEl.innerHTML = getTrendElement(weightTrend.trend, weightTrend.values);
            }
        } else {
            const latestWeight = document.getElementById('latest-weight');
            if (latestWeight) {
                latestWeight.innerHTML = 'N/A';
            }
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

            grid.innerHTML += `<div class="summary-card">
                <div class="summary-label">Since Last Weigh-in</div>
                <div class="summary-value">${recentDiff !== null ? (parseFloat(recentDiff) <= 0 ? '' : '+') + recentDiff : 'N/A'} <span>kg</span></div>
                <div class="summary-sub">${healthSummary.prevDate || 'N/A'} → ${healthSummary.lastDate}</div>
            </div>`;

            grid.innerHTML += `<div class="summary-card">
                <div class="summary-label">Change</div>
                <div class="summary-value">${parseFloat(healthSummary.change) <= 0 ? '' : '+'}${healthSummary.change} <span>kg</span></div>
                <div class="summary-sub">${healthSummary.pctChange}% · ${healthSummary.firstDate} → ${healthSummary.lastDate}</div>
            </div>`;

            const container = document.querySelector('.hero-stat-container');
            if (container) {
                container.insertAdjacentElement('afterend', grid);
            }
        }
    });
});
