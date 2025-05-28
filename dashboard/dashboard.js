let sleepData = [];
        let filteredData = [];
        // Generate sample data based on your structure
        // const generateSleepData = (n = 200) => {
        //     const data = [];
        //     const genders = ['M', 'F'];
            
        //     for (let i = 0; i < n; i++) {
        //         const age = Math.random() * 60 + 20; // 20-80
        //         const gender = genders[Math.floor(Math.random() * 2)];
        //         const height = gender === 'M' ? 160 + Math.random() * 25 : 150 + Math.random() * 25;
        //         const weight = height * (0.4 + Math.random() * 0.3); // Rough BMI calculation
        //         const stress = Math.random() * 50 + 1;
        //         const meq = Math.random() * 60 + 20; // Chronotype score
        //         const sleepDuration = 4 + Math.random() * 8; // 4-12 hours
                
        //         // Sleep quality correlations
        //         const baseEfficiency = 85 - (age - 30) * 0.2 - stress * 0.3 + (sleepDuration - 6) * 2;
        //         const efficiency = Math.max(50, Math.min(98, baseEfficiency + (Math.random() - 0.5) * 10));
                
        //         const baseWASO = 5 + (age - 30) * 0.3 + stress * 0.4 + Math.max(0, 8 - sleepDuration) * 3;
        //         const waso = Math.max(0, baseWASO + (Math.random() - 0.5) * 10);
                
        //         const baseLatency = 2 + stress * 0.3 + Math.max(0, sleepDuration - 8) * 2;
        //         const latency = Math.max(0, baseLatency + (Math.random() - 0.5) * 5);
                
        //         const baseAwakenings = 2 + (age - 30) * 0.1 + stress * 0.1;
        //         const awakenings = Math.max(0, Math.round(baseAwakenings + (Math.random() - 0.5) * 3));
                
        //         const activityLevel = Math.random() * 10 + 1;
                
        //         data.push({
        //             id: i,
        //             gender,
        //             height: Math.round(height),
        //             weight: Math.round(weight),
        //             age: Math.round(age),
        //             stress: Math.round(stress),
        //             meq: Math.round(meq),
        //             sleepDuration: Math.round(sleepDuration * 10) / 10,
        //             efficiency: Math.round(efficiency * 10) / 10,
        //             waso: Math.round(waso * 10) / 10,
        //             latency: Math.round(latency * 10) / 10,
        //             awakenings: awakenings,
        //             activityLevel: Math.round(activityLevel)
        //         });
        //     }
        //     return data;
        // };
        
        // let sleepData = generateSleepData();
        d3.csv("data/all_users.csv").then(data => {
        sleepData = data.map(d => ({
        id: d.participant,
        age: +d.Age,
        stress: +d.Daily_stress,
        sleepDuration: +d["Total Sleep Time (TST)"] / 60, // convert mins → hrs
        efficiency: +d.Efficiency,
        waso: +d["Wake After Sleep Onset (WASO)"],
        latency: +d.Latency,
        awakenings: +d["Number of Awakenings"],
        activityLevel: +d.activityMinutes || 0
     }));

        filteredData = [...sleepData];
        initCharts();
        });

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
        function initCharts() {
            createEfficiencyChart();
            createWASOChart();
            createLatencyChart();
            createAwakeningsChart();
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
        

        
        function updateAllCharts() {
            // Recreate charts with filtered data
            createWASOChart();
            createLatencyChart();
            createAwakeningsChart();
            
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
        
        // Initialize
        initCharts();