const FILES = {
    logs: 'mypeptideapp_peptide_logs.csv',
    metrics: 'mypeptideapp_health_metrics.csv'
};
function loadAndRenderCSV(filename, containerId, columnsToShow, onDataLoaded = null) {
    Papa.parse(filename, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            renderTable(results.data, containerId, columnsToShow);
            
            if (onDataLoaded) {
                onDataLoaded(results.data);
            }
        },
        error: function(error) {
            document.getElementById(containerId).innerHTML = 
                `<div class="error">Error loading ${filename}: ${error.message}. Ensure the file exists in the same directory.</div>`;
        }
    });
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
document.addEventListener("DOMContentLoaded", () => {
    
    const logColumns = ["Injection Date", "Peptide", "Dose", "Unit", "Injection Site"];
    loadAndRenderCSV(FILES.logs, "logs-container", logColumns);
    const metricColumns = ["Date", "Metric Type", "Value 1", "Unit"];
    
    loadAndRenderCSV(FILES.metrics, "metrics-container", metricColumns, function(data) {
        
        const weightRecords = data.filter(row => row["Metric Type"] === "Weight" && row["Value 1"]);
        
        if (weightRecords.length > 0) {
            weightRecords.sort((a, b) => new Date(b.Date) - new Date(a.Date));
            
            const latestWeight = weightRecords[0];
            
            document.getElementById('latest-weight').innerHTML = `${latestWeight["Value 1"]} <span>${latestWeight["Unit"]}</span>`;
        } else {
            document.getElementById('latest-weight').innerHTML = `N/A`;
        }
    });
    
});