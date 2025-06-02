let sleepData = [];
let filteredData = [];
let activityData = [];

        // Load both CSV files
Promise.all([
    d3.csv("data/all_users.csv"),
    d3.csv("data/activity_summary.csv")
]).then(([sleepCsv, activityCsv]) => {
    // Process sleep data
    sleepData = sleepCsv.map(d => ({
        id: d.participant,
        age: +d.Age,
        stress: +d.Daily_stress,
        sleepDuration: +d["Total Sleep Time (TST)"] / 60,
        efficiency: +d.Efficiency,
        waso: +d["Wake After Sleep Onset (WASO)"],
        latency: +d.Latency,
        awakenings: +d["Number of Awakenings"],
        activityLevel: +d.activityMinutes || 0
    }));
    
    // Process activity data
    activityData = activityCsv.map(d => ({
        id: d.user_id,
        screenSmall: +d.screen_small_minutes,
        screenLarge: +d.screen_large_minutes,
        movementLight: +d.movement_light_minutes,
        movementMedium: +d.movement_medium_minutes,
        movementHeavy: +d.movement_heavy_minutes,
        caffeineEvents: +d.caffeine_events,
        alcoholEvents: +d.alcohol_events
    }));
    
    // Merge the datasets
    sleepData = sleepData.map(sleep => {
        const activity = activityData.find(act => act.id === sleep.id);
        return { ...sleep, ...activity };
    }).filter(d => d.caffeineEvents !== undefined); // Only keep records with activity data
    
    filteredData = [...sleepData];
    initCharts();
});

        // filteredData = [...sleepData];
        // initCharts();
        // });

        // let filteredData = [...sleepData];
        
        // Chart dimensions
        const margin = {top: 20, right: 30, bottom: 40, left: 50};
        const chartWidth = 400 - margin.left - margin.right;
        const chartHeight = 300 - margin.top - margin.bottom;
        
        // Color scales
        const stressColorScale = d3.scaleSequential(d3.interpolateReds).domain([1, 50]);
        const ageColorScale = d3.scaleSequential(d3.interpolateBlues).domain([20, 80]);
        
        // Tooltip
        const tooltip = d3.select("#tooltip");
        
        // Initialize charts
        // function initCharts() {
        //     createEfficiencyChart();
        //     createWASOChart();
        //     createLatencyChart();
        //     createAwakeningsChart();
        //     updateMetrics();
        // }
        function initCharts() {
            createEfficiencyChart();
            createWASOChart();
            createLatencyChart();
            createAwakeningsChart();
            createCaffeineChart();
            createMovementChart();
            createScreenChart();
            updateMetrics();
        }
        
        function createEfficiencyChart() {
            const svg = d3.select("#efficiency-chart");
            svg.selectAll("*").remove();
            
            const g = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
            
            const xScale = d3.scaleLinear()
                .domain([4, 12])
                .range([0, chartWidth]);
            
            const yScale = d3.scaleLinear()
                .domain([50, 100])
                .range([chartHeight, 0]);
            
            // Axes
            g.append("g")
                .attr("class", "axis")
                .attr("transform", `translate(0,${chartHeight})`)
                .call(d3.axisBottom(xScale));
            
            g.append("g")
                .attr("class", "axis")
                .call(d3.axisLeft(yScale));
            
            // Axis labels
            g.append("text")
                .attr("class", "axis-label")
                .attr("transform", `translate(${chartWidth/2}, ${chartHeight + 35})`)
                .style("text-anchor", "middle")
                .text("Sleep Duration (hours)");
            
            g.append("text")
                .attr("class", "axis-label")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left)
                .attr("x", 0 - (chartHeight / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("Sleep Efficiency (%)");
            
            updateEfficiencyChart(g, xScale, yScale);
        }
        
        function updateEfficiencyChart(g, xScale, yScale) {
            const dots = g.selectAll(".dot")
                .data(filteredData, d => d.id);
            
            dots.enter()
                .append("circle")
                .attr("class", "dot")
                .attr("r", 4)
                .merge(dots)
                .transition()
                .duration(300)
                .attr("cx", d => xScale(d.sleepDuration))
                .attr("cy", d => yScale(d.efficiency))
                .attr("fill", d => stressColorScale(d.stress));
            
            dots.exit().remove();
            
            g.selectAll(".dot")
                .on("mouseover", (event, d) => {
                    tooltip.style("opacity", 1)
                        .html(`Duration: ${d.sleepDuration}h<br/>Efficiency: ${d.efficiency}%<br/>Stress: ${d.stress}<br/>Age: ${d.age}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mouseout", () => {
                    tooltip.style("opacity", 0);
                });
        }
        
        function createWASOChart() {
            const svg = d3.select("#waso-chart");
            svg.selectAll("*").remove();
            
            const g = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
            
            // Group data by stress ranges
            const stressBins = d3.range(0, 51, 5);
            const binData = stressBins.map(bin => {
                const inBin = filteredData.filter(d => d.stress >= bin && d.stress < bin + 5);
                return {
                    stress: bin + 2.5,
                    avgWASO: d3.mean(inBin, d => d.waso) || 0,
                    count: inBin.length
                };
            }).filter(d => d.count > 0);
            
            const xScale = d3.scaleBand()
                .domain(binData.map(d => d.stress))
                .range([0, chartWidth])
                .padding(0.1);
            
            const yScale = d3.scaleLinear()
                .domain([0, d3.max(binData, d => d.avgWASO) || 50])
                .range([chartHeight, 0]);
            
            // Axes
            g.append("g")
                .attr("class", "axis")
                .attr("transform", `translate(0,${chartHeight})`)
                .call(d3.axisBottom(xScale).tickFormat(d => Math.round(d)));
            
            g.append("g")
                .attr("class", "axis")
                .call(d3.axisLeft(yScale));
            
            // Axis labels
            g.append("text")
                .attr("class", "axis-label")
                .attr("transform", `translate(${chartWidth/2}, ${chartHeight + 35})`)
                .style("text-anchor", "middle")
                .text("Stress Level");
            
            g.append("text")
                .attr("class", "axis-label")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left)
                .attr("x", 0 - (chartHeight / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("Average WASO (min)");
            
            // Bars
            g.selectAll(".bar")
                .data(binData)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", d => xScale(d.stress))
                .attr("width", xScale.bandwidth())
                .attr("y", d => yScale(d.avgWASO))
                .attr("height", d => chartHeight - yScale(d.avgWASO))
                .attr("fill", "#ff6b6b")
                .on("mouseover", (event, d) => {
                    tooltip.style("opacity", 1)
                        .html(`Stress: ${Math.round(d.stress)}<br/>Avg WASO: ${d.avgWASO.toFixed(1)} min<br/>Count: ${d.count}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mouseout", () => {
                    tooltip.style("opacity", 0);
                });
        }
        
        function createLatencyChart() {
            const svg = d3.select("#latency-chart");
            svg.selectAll("*").remove();
            
            const g = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
            
            const bins = d3.histogram()
                .value(d => d.latency)
                .domain([0, 30])
                .thresholds(15)(filteredData);
            
            const xScale = d3.scaleLinear()
                .domain([0, 30])
                .range([0, chartWidth]);
            
            const yScale = d3.scaleLinear()
                .domain([0, d3.max(bins, d => d.length)])
                .range([chartHeight, 0]);
            
            // Axes
            g.append("g")
                .attr("class", "axis")
                .attr("transform", `translate(0,${chartHeight})`)
                .call(d3.axisBottom(xScale));
            
            g.append("g")
                .attr("class", "axis")
                .call(d3.axisLeft(yScale));
            
            // Axis labels
            g.append("text")
                .attr("class", "axis-label")
                .attr("transform", `translate(${chartWidth/2}, ${chartHeight + 35})`)
                .style("text-anchor", "middle")
                .text("Sleep Latency (min)");
            
            g.append("text")
                .attr("class", "axis-label")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left)
                .attr("x", 0 - (chartHeight / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("Frequency");
            
            // Bars
            g.selectAll(".bar")
                .data(bins)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", d => xScale(d.x0))
                .attr("width", d => xScale(d.x1) - xScale(d.x0) - 1)
                .attr("y", d => yScale(d.length))
                .attr("height", d => chartHeight - yScale(d.length))
                .attr("fill", "#4ecdc4");
        }
        
        function createAwakeningsChart() {
            const svg = d3.select("#awakenings-chart");
            svg.selectAll("*").remove();
            
            const g = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
            
            const xScale = d3.scaleLinear()
                .domain([20, 80])
                .range([0, chartWidth]);
            
            const yScale = d3.scaleLinear()
                .domain([0, d3.max(filteredData, d => d.awakenings) + 1])
                .range([chartHeight, 0]);
            
            // Axes
            g.append("g")
                .attr("class", "axis")
                .attr("transform", `translate(0,${chartHeight})`)
                .call(d3.axisBottom(xScale));
            
            g.append("g")
                .attr("class", "axis")
                .call(d3.axisLeft(yScale));
            
            // Axis labels
            g.append("text")
                .attr("class", "axis-label")
                .attr("transform", `translate(${chartWidth/2}, ${chartHeight + 35})`)
                .style("text-anchor", "middle")
                .text("Age");
            
            g.append("text")
                .attr("class", "axis-label")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left)
                .attr("x", 0 - (chartHeight / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("Number of Awakenings");
            
            // Dots
            g.selectAll(".dot")
                .data(filteredData)
                .enter()
                .append("circle")
                .attr("class", "dot")
                .attr("cx", d => xScale(d.age))
                .attr("cy", d => yScale(d.awakenings))
                .attr("r", 3)
                .attr("fill", d => ageColorScale(d.age))
                .on("mouseover", (event, d) => {
                    tooltip.style("opacity", 1)
                        .html(`Age: ${d.age}<br/>Awakenings: ${d.awakenings}<br/>Sleep Duration: ${d.sleepDuration}h`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mouseout", () => {
                    tooltip.style("opacity", 0);
                });
        }

        function createCaffeineChart() {
            const svg = d3.select("#caffeine-chart");
            svg.selectAll("*").remove();
            
            const g = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
            
            const xScale = d3.scaleLinear()
                .domain([0, d3.max(filteredData, d => d.caffeineEvents) || 10])
                .range([0, chartWidth]);
            
            const yScale = d3.scaleLinear()
                .domain([d3.min(filteredData, d => d.efficiency) - 5, d3.max(filteredData, d => d.efficiency) + 5])
                .range([chartHeight, 0]);
            
            // Axes
            g.append("g")
                .attr("class", "axis")
                .attr("transform", `translate(0,${chartHeight})`)
                .call(d3.axisBottom(xScale));
            
            g.append("g")
                .attr("class", "axis")
                .call(d3.axisLeft(yScale));
            
            // Axis labels
            g.append("text")
                .attr("class", "axis-label")
                .attr("transform", `translate(${chartWidth/2}, ${chartHeight + 35})`)
                .style("text-anchor", "middle")
                .text("Caffeine Events per Day");
            
            g.append("text")
                .attr("class", "axis-label")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left)
                .attr("x", 0 - (chartHeight / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("Sleep Efficiency (%)");
            
            // Dots
            g.selectAll(".dot")
                .data(filteredData)
                .enter()
                .append("circle")
                .attr("class", "dot")
                .attr("cx", d => xScale(d.caffeineEvents))
                .attr("cy", d => yScale(d.efficiency))
                .attr("r", 4)
                .attr("fill", "#e74c3c")
                .on("mouseover", (event, d) => {
                    tooltip.style("opacity", 1)
                        .html(`Caffeine: ${d.caffeineEvents} events<br/>Efficiency: ${d.efficiency}%<br/>ID: ${d.id}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mouseout", () => {
                    tooltip.style("opacity", 0);
                });
        }
        
        function createMovementChart() {
            const svg = d3.select("#movement-chart");
            svg.selectAll("*").remove();
            
            const g = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
            
            const movementType = d3.select("#movement-select").property("value");
            const movementKey = `movement${movementType.charAt(0).toUpperCase() + movementType.slice(1)}`;
            
            const xScale = d3.scaleLinear()
                .domain([0, d3.max(filteredData, d => d[movementKey]) || 200])
                .range([0, chartWidth]);
            
            const yScale = d3.scaleLinear()
                .domain([0, d3.max(filteredData, d => d.latency) + 5])
                .range([chartHeight, 0]);
            
            // Axes
            g.append("g")
                .attr("class", "axis")
                .attr("transform", `translate(0,${chartHeight})`)
                .call(d3.axisBottom(xScale));
            
            g.append("g")
                .attr("class", "axis")
                .call(d3.axisLeft(yScale));
            
            // Axis labels
            g.append("text")
                .attr("class", "axis-label")
                .attr("transform", `translate(${chartWidth/2}, ${chartHeight + 35})`)
                .style("text-anchor", "middle")
                .text(`${movementType.charAt(0).toUpperCase() + movementType.slice(1)} Movement (min)`);
            
            g.append("text")
                .attr("class", "axis-label")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left)
                .attr("x", 0 - (chartHeight / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("Sleep Latency (min)");
            
            // Dots
            g.selectAll(".dot")
                .data(filteredData)
                .enter()
                .append("circle")
                .attr("class", "dot")
                .attr("cx", d => xScale(d[movementKey]))
                .attr("cy", d => yScale(d.latency))
                .attr("r", 4)
                .attr("fill", "#3498db")
                .on("mouseover", (event, d) => {
                    tooltip.style("opacity", 1)
                        .html(`${movementType} Movement: ${d[movementKey]} min<br/>Latency: ${d.latency} min<br/>ID: ${d.id}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mouseout", () => {
                    tooltip.style("opacity", 0);
                });
        }
        
        function createScreenChart() {
            const svg = d3.select("#screen-chart");
            svg.selectAll("*").remove();
            
            const g = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
            
            const screenType = d3.select("#screen-select").property("value");
            const screenKey = `screen${screenType.charAt(0).toUpperCase() + screenType.slice(1)}`;
            
            const xScale = d3.scaleLinear()
                .domain([0, d3.max(filteredData, d => d[screenKey]) || 200])
                .range([0, chartWidth]);
            
            const yScale = d3.scaleLinear()
                .domain([0, d3.max(filteredData, d => d.waso) + 10])
                .range([chartHeight, 0]);
            
            // Axes
            g.append("g")
                .attr("class", "axis")
                .attr("transform", `translate(0,${chartHeight})`)
                .call(d3.axisBottom(xScale));
            
            g.append("g")
                .attr("class", "axis")
                .call(d3.axisLeft(yScale));
            
            // Axis labels
            g.append("text")
                .attr("class", "axis-label")
                .attr("transform", `translate(${chartWidth/2}, ${chartHeight + 35})`)
                .style("text-anchor", "middle")
                .text(`${screenType.charAt(0).toUpperCase() + screenType.slice(1)} Screen Time (min)`);
            
            g.append("text")
                .attr("class", "axis-label")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left)
                .attr("x", 0 - (chartHeight / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("WASO (min)");
            
            // Dots
            g.selectAll(".dot")
                .data(filteredData)
                .enter()
                .append("circle")
                .attr("class", "dot")
                .attr("cx", d => xScale(d[screenKey]))
                .attr("cy", d => yScale(d.waso))
                .attr("r", 4)
                .attr("fill", "#9b59b6")
                .on("mouseover", (event, d) => {
                    tooltip.style("opacity", 1)
                        .html(`${screenType} Screen: ${d[screenKey]} min<br/>WASO: ${d.waso} min<br/>ID: ${d.id}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mouseout", () => {
                    tooltip.style("opacity", 0);
                });
        }
        
        function updateMetrics() {
            const avgEfficiency = d3.mean(filteredData, d => d.efficiency);
            const avgWASO = d3.mean(filteredData, d => d.waso);
            const avgLatency = d3.mean(filteredData, d => d.latency);
            
            d3.select("#avg-efficiency").text(avgEfficiency ? avgEfficiency.toFixed(1) + "%" : "--");
            d3.select("#avg-waso").text(avgWASO ? avgWASO.toFixed(1) : "--");
            d3.select("#avg-latency").text(avgLatency ? avgLatency.toFixed(1) : "--");
        }
        
        function filterData() {
            const durationValue = +d3.select("#duration-slider").property("value");
            const stressValue = +d3.select("#stress-slider").property("value");
            const ageValue = +d3.select("#age-slider").property("value");
            const activityValue = +d3.select("#activity-slider").property("value");

            // Initial filtering with moderate thresholds
            filteredData = sleepData.filter(d => {
            return Math.abs(d.age - ageValue) <= 15 &&
               Math.abs(d.activityLevel - activityValue) <= 500;
             });

            // If too few points, expand criteria
            if (filteredData.length < 20) {
                 filteredData = sleepData.filter(d => {
            return Math.abs(d.sleepDuration - durationValue) <= 2 &&
                   Math.abs(d.stress - stressValue) <= 20 &&
                   Math.abs(d.age - ageValue) <= 15 &&
                   Math.abs(d.activityLevel - activityValue) <= 1000; // based on your CSV
             });
            }
        
            
            // Update metrics
            updateMetrics();
            
            // Update all charts with filtered data
            updateAllCharts();

        }
        

        
        // function updateAllCharts() {
        //     // Recreate charts with filtered data
        //     createWASOChart();
        //     createLatencyChart();
        //     createAwakeningsChart();
            
        //     // Update efficiency chart dots
        //     const svg = d3.select("#efficiency-chart");
        //     const g = svg.select("g");
        //     const xScale = d3.scaleLinear().domain([4, 12]).range([0, chartWidth]);
        //     const yScale = d3.scaleLinear().domain([50, 100]).range([chartHeight, 0]);
        //     updateEfficiencyChart(g, xScale, yScale);
        // }
        function updateAllCharts() {
            // Recreate charts with filtered data
            createWASOChart();
            createLatencyChart();
            createAwakeningsChart();
            createCaffeineChart();
            createMovementChart();
            createScreenChart();
            
            // Update efficiency chart dots
            const svg = d3.select("#efficiency-chart");
            const g = svg.select("g");
            const xScale = d3.scaleLinear().domain([4, 12]).range([0, chartWidth]);
            const yScale = d3.scaleLinear().domain([50, 100]).range([chartHeight, 0]);
            updateEfficiencyChart(g, xScale, yScale);
        }
        
        // Event listeners
        d3.select("#duration-slider").on("input", function() {
            d3.select("#duration-value").text(this.value + "h");
            filterData();
        });
        
        d3.select("#stress-slider").on("input", function() {
            d3.select("#stress-value").text(this.value);
            filterData();
        });
        
        d3.select("#age-slider").on("input", function() {
            d3.select("#age-value").text(this.value);
            filterData();
        });
        
        d3.select("#activity-slider").on("input", function() {
            d3.select("#activity-value").text(this.value);
            filterData();
        });

        // Activity section event listeners
        d3.select("#caffeine-slider").on("input", function() {
            d3.select("#caffeine-value").text(this.value);
            createCaffeineChart();
        });

        d3.select("#movement-select").on("change", function() {
            createMovementChart();
        });

        d3.select("#screen-select").on("change", function() {
            createScreenChart();
        });
        
        // Initialize
        initCharts();