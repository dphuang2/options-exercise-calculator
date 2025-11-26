// 2025 Tax Constants
// Verified from IRS and California FTB sources:
// - Federal Standard Deduction: Single $15,750, Married $31,500, Head of Household $23,625
// - California Standard Deduction: Single $5,706, Married $11,412
// - AMT Exemption: Single $88,100, Married $176,200 (typically double single)
// - AMT rates: 26% up to $199,900, 28% above
const TAX_CONSTANTS = {
    federal: {
        single: {
            brackets: [
                { min: 0, max: 11925, rate: 0.10 },
                { min: 11926, max: 48475, rate: 0.12 },
                { min: 48476, max: 103350, rate: 0.22 },
                { min: 103351, max: 197300, rate: 0.24 },
                { min: 197301, max: 250525, rate: 0.32 },
                { min: 250526, max: 626350, rate: 0.35 },
                { min: 626351, max: Infinity, rate: 0.37 }
            ],
            standardDeduction: 15750
        },
        married: {
            brackets: [
                { min: 0, max: 23850, rate: 0.10 },
                { min: 23851, max: 96950, rate: 0.12 },
                { min: 96951, max: 206700, rate: 0.22 },
                { min: 206701, max: 394600, rate: 0.24 },
                { min: 394601, max: 501050, rate: 0.32 },
                { min: 501051, max: 751600, rate: 0.35 },
                { min: 751601, max: Infinity, rate: 0.37 }
            ],
            standardDeduction: 31500
        },
        head: {
            brackets: [
                { min: 0, max: 17000, rate: 0.10 },
                { min: 17001, max: 64850, rate: 0.12 },
                { min: 64851, max: 103350, rate: 0.22 },
                { min: 103351, max: 197300, rate: 0.24 },
                { min: 197301, max: 250500, rate: 0.32 },
                { min: 250501, max: 626350, rate: 0.35 },
                { min: 626351, max: Infinity, rate: 0.37 }
            ],
            standardDeduction: 23625
        }
    },
    california: {
        single: {
            brackets: [
                { min: 0, max: 10756, rate: 0.01 },
                { min: 10757, max: 25499, rate: 0.02 },
                { min: 25500, max: 40245, rate: 0.04 },
                { min: 40246, max: 55866, rate: 0.06 },
                { min: 55867, max: 70606, rate: 0.08 },
                { min: 70607, max: 360659, rate: 0.093 },
                { min: 360660, max: 432787, rate: 0.103 },
                { min: 432788, max: 721314, rate: 0.113 },
                { min: 721315, max: Infinity, rate: 0.123 }
            ],
            standardDeduction: 5706
        },
        married: {
            brackets: [
                { min: 0, max: 21512, rate: 0.01 },
                { min: 21513, max: 50998, rate: 0.02 },
                { min: 50999, max: 80490, rate: 0.04 },
                { min: 80491, max: 111732, rate: 0.06 },
                { min: 111733, max: 141212, rate: 0.08 },
                { min: 141213, max: 721318, rate: 0.093 },
                { min: 721319, max: 865574, rate: 0.103 },
                { min: 865575, max: 1442628, rate: 0.113 },
                { min: 1442629, max: Infinity, rate: 0.123 }
            ],
            standardDeduction: 11412
        },
        head: {
            // Using single brackets for head of household (approximation)
            brackets: [
                { min: 0, max: 10756, rate: 0.01 },
                { min: 10757, max: 25499, rate: 0.02 },
                { min: 25500, max: 40245, rate: 0.04 },
                { min: 40246, max: 55866, rate: 0.06 },
                { min: 55867, max: 70606, rate: 0.08 },
                { min: 70607, max: 360659, rate: 0.093 },
                { min: 360660, max: 432787, rate: 0.103 },
                { min: 432788, max: 721314, rate: 0.113 },
                { min: 721315, max: Infinity, rate: 0.123 }
            ],
            standardDeduction: 5706
        }
    },
    amt: {
        single: {
            exemption: 88100,
            brackets: [
                { min: 0, max: 199900, rate: 0.26 },
                { min: 199901, max: Infinity, rate: 0.28 }
            ]
        },
        married: {
            exemption: 176200,
            brackets: [
                { min: 0, max: 199900, rate: 0.26 },
                { min: 199901, max: Infinity, rate: 0.28 }
            ]
        },
        head: {
            exemption: 88100,
            brackets: [
                { min: 0, max: 199900, rate: 0.26 },
                { min: 199901, max: Infinity, rate: 0.28 }
            ]
        }
    }
};

function calculateTax(income, brackets) {
    if (income <= 0) return 0;
    
    let tax = 0;
    
    for (const bracket of brackets) {
        const bracketMin = bracket.min;
        const bracketMax = bracket.max === Infinity ? income : bracket.max;
        
        // If income exceeds this bracket's minimum, calculate tax on the portion in this bracket
        if (income > bracketMin) {
            // Amount of income that falls in this bracket
            const taxableInBracket = Math.min(income, bracketMax) - bracketMin;
            
            if (taxableInBracket > 0) {
                tax += taxableInBracket * bracket.rate;
            }
        }
    }
    
    return tax;
}

function calculateFederalTax(taxableIncome, filingStatus) {
    const config = TAX_CONSTANTS.federal[filingStatus];
    return calculateTax(taxableIncome, config.brackets);
}

function calculateCaliforniaTax(taxableIncome, filingStatus) {
    const config = TAX_CONSTANTS.california[filingStatus];
    return calculateTax(taxableIncome, config.brackets);
}

function calculateAMT(regularTaxableIncome, isoIncome, filingStatus) {
    const amtConfig = TAX_CONSTANTS.amt[filingStatus];
    
    // AMT taxable income includes ISO bargain element
    const amtTaxableIncome = regularTaxableIncome + isoIncome;
    
    // Subtract AMT exemption
    let amtBase = Math.max(0, amtTaxableIncome - amtConfig.exemption);
    
    // Calculate AMT
    const amt = calculateTax(amtBase, amtConfig.brackets);
    
    // Regular tax
    const regularTax = calculateFederalTax(regularTaxableIncome, filingStatus);
    
    // AMT is only paid if it's higher than regular tax
    return Math.max(0, amt - regularTax);
}

function getDetailedAMTBreakdown(regularTaxableIncome, isoIncome, filingStatus) {
    const amtConfig = TAX_CONSTANTS.amt[filingStatus];
    const regularTax = calculateFederalTax(regularTaxableIncome, filingStatus);
    
    // Step 1: Regular taxable income (salary only for ISOs)
    const step1RegularTaxableIncome = regularTaxableIncome;
    
    // Step 2: Add ISO spread to get AMT taxable income
    const step2AMTTaxableIncome = regularTaxableIncome + isoIncome;
    
    // Step 3: Apply AMT exemption
    const step3AMTExemption = amtConfig.exemption;
    const step3AMTBase = Math.max(0, step2AMTTaxableIncome - step3AMTExemption);
    
    // Step 4: Calculate AMT tax
    const step4AMTTax = calculateTax(step3AMTBase, amtConfig.brackets);
    
    // Step 5: Compare AMT vs Regular tax
    const step5AMTOwed = Math.max(0, step4AMTTax - regularTax);
    
    // Calculate breakdown by bracket for AMT
    const amtBracketBreakdown = [];
    
    for (const bracket of amtConfig.brackets) {
        const bracketMin = bracket.min;
        const bracketMax = bracket.max === Infinity ? step3AMTBase : bracket.max;
        
        // If AMT base exceeds this bracket's minimum, calculate tax on the portion in this bracket
        if (step3AMTBase > bracketMin) {
            // Amount of AMT base that falls in this bracket
            const taxableInBracket = Math.min(step3AMTBase, bracketMax) - bracketMin;
            
            if (taxableInBracket > 0) {
                const taxInBracket = taxableInBracket * bracket.rate;
                amtBracketBreakdown.push({
                    range: bracket.max === Infinity ? `Over $${formatNumber(bracketMin)}` : `$${formatNumber(bracketMin)} - $${formatNumber(bracketMax)}`,
                    amount: taxableInBracket,
                    rate: bracket.rate * 100,
                    tax: taxInBracket
                });
            }
        }
    }
    
    return {
        step1RegularTaxableIncome,
        step2AMTTaxableIncome,
        step3AMTExemption,
        step3AMTBase,
        step4AMTTax,
        step5RegularTax: regularTax,
        step5AMTOwed,
        amtBracketBreakdown
    };
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
}

function calculateScenario(totalOptions, exercisePrice, fmv, salary, sharesToExercise, filingStatus, baselineTax = null) {
    const spreadPerShare = fmv - exercisePrice;
    const optionIncome = sharesToExercise * spreadPerShare;
    const totalIncome = salary + optionIncome;
    
    // For ISOs: Regular tax is ONLY on salary (ISO spread is NOT taxed as ordinary income at exercise)
    const fedStandardDeduction = TAX_CONSTANTS.federal[filingStatus].standardDeduction;
    const salaryTaxableIncome = Math.max(0, salary - fedStandardDeduction);
    
    // California: Also only taxes salary for ISOs (spread deferred until sale)
    const caStandardDeduction = TAX_CONSTANTS.california[filingStatus].standardDeduction;
    const caSalaryTaxableIncome = Math.max(0, salary - caStandardDeduction);
    
    // Regular taxes (only on salary, NOT on ISO spread)
    const federalTax = calculateFederalTax(salaryTaxableIncome, filingStatus);
    const californiaTax = calculateCaliforniaTax(caSalaryTaxableIncome, filingStatus);
    
    // AMT: Includes ISO spread in AMT taxable income
    // AMT = AMT tax (on salary + ISO spread) - Regular tax (on salary only)
    const amt = calculateAMT(salaryTaxableIncome, optionIncome, filingStatus);
    
    const totalTax = federalTax + californiaTax + amt;
    
    // Calculate incremental tax (tax on options only)
    let incrementalTax = totalTax;
    if (baselineTax !== null) {
        incrementalTax = totalTax - baselineTax;
    }
    
    const afterTaxValue = optionIncome - incrementalTax;
    const effectiveRate = totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0;
    
    return {
        shares: sharesToExercise,
        optionIncome,
        totalIncome,
        federalTax,
        californiaTax,
        amt,
        totalTax,
        incrementalTax,
        afterTaxValue,
        effectiveRate
    };
}

function findMaxSharesWithoutAMT(totalOptions, exercisePrice, fmv, salary, filingStatus) {
    const spreadPerShare = fmv - exercisePrice;
    const fedStandardDeduction = TAX_CONSTANTS.federal[filingStatus].standardDeduction;
    const salaryTaxableIncome = Math.max(0, salary - fedStandardDeduction);
    const regularTaxOnSalary = calculateFederalTax(salaryTaxableIncome, filingStatus);
    
    const amtConfig = TAX_CONSTANTS.amt[filingStatus];
    
    // Binary search to find maximum shares without AMT
    // For ISOs: Regular tax is only on salary, AMT includes ISO spread
    let low = 0;
    let high = totalOptions;
    let maxSharesNoAMT = 0;
    
    // Use binary search for efficiency
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const optionIncome = mid * spreadPerShare;
        
        // AMT calculation: includes ISO spread
        const amtTaxableIncome = salaryTaxableIncome + optionIncome;
        const amtBase = Math.max(0, amtTaxableIncome - amtConfig.exemption);
        const amtTax = calculateTax(amtBase, amtConfig.brackets);
        
        // Regular tax: only on salary (ISOs not taxed as ordinary income at exercise)
        const regularTax = regularTaxOnSalary;
        
        // Check if AMT would be triggered
        const amtOwed = Math.max(0, amtTax - regularTax);
        
        if (amtOwed === 0) {
            // No AMT, we can exercise more
            maxSharesNoAMT = mid;
            low = mid + 1;
        } else {
            // AMT triggered, reduce shares
            high = mid - 1;
        }
    }
    
    return maxSharesNoAMT;
}

function generateScenarios(totalOptions, exercisePrice, fmv, salary, filingStatus) {
    const scenarios = [];
    const baseline = calculateScenario(totalOptions, exercisePrice, fmv, salary, 0, filingStatus);
    const baselineTax = baseline.totalTax;
    
    const maxSharesNoAMT = findMaxSharesWithoutAMT(totalOptions, exercisePrice, fmv, salary, filingStatus);
    
    // Generate scenarios: 0%, 25%, 50%, 75%, 100%, max without AMT, and one just above AMT threshold
    const percentages = [0, 0.25, 0.5, 0.75, 1.0];
    const shareAmounts = percentages.map(p => Math.floor(totalOptions * p));
    
    // Add max shares without AMT if not already in list
    if (!shareAmounts.includes(maxSharesNoAMT) && maxSharesNoAMT > 0) {
        shareAmounts.push(maxSharesNoAMT);
        shareAmounts.sort((a, b) => a - b);
    }
    
    // Add one scenario just above AMT threshold to show the difference
    if (maxSharesNoAMT < totalOptions) {
        const justAboveAMT = Math.min(totalOptions, maxSharesNoAMT + Math.max(1, Math.floor(totalOptions * 0.05)));
        if (!shareAmounts.includes(justAboveAMT)) {
            shareAmounts.push(justAboveAMT);
            shareAmounts.sort((a, b) => a - b);
        }
    }
    
    // Add scenarios around the max without AMT for fine-tuning
    const fineTuneSteps = [
        Math.max(0, maxSharesNoAMT - Math.floor(totalOptions * 0.1)), 
        Math.min(totalOptions, maxSharesNoAMT + Math.floor(totalOptions * 0.1))
    ];
    fineTuneSteps.forEach(shares => {
        if (shares > 0 && shares <= totalOptions && !shareAmounts.includes(shares)) {
            shareAmounts.push(shares);
        }
    });
    
    shareAmounts.sort((a, b) => a - b);
    
    shareAmounts.forEach(shares => {
        scenarios.push(calculateScenario(totalOptions, exercisePrice, fmv, salary, shares, filingStatus, baselineTax));
    });
    
    return { scenarios, recommendedShares: maxSharesNoAMT };
}

// Save form data to localStorage
function saveFormData() {
    const formData = {
        totalOptions: document.getElementById('totalOptions').value,
        exercisePrice: document.getElementById('exercisePrice').value,
        fmv: document.getElementById('fmv').value,
        salary: document.getElementById('salary').value,
        filingStatus: document.getElementById('filingStatus').value,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('exerciseCalculatorData', JSON.stringify(formData));
    updatePreviousSessionDisplay();
}

// Load form data from localStorage
function loadFormData() {
    const savedData = localStorage.getItem('exerciseCalculatorData');
    if (savedData) {
        try {
            const formData = JSON.parse(savedData);
            if (formData.totalOptions) document.getElementById('totalOptions').value = formData.totalOptions;
            if (formData.exercisePrice) document.getElementById('exercisePrice').value = formData.exercisePrice;
            if (formData.fmv) document.getElementById('fmv').value = formData.fmv;
            if (formData.salary) document.getElementById('salary').value = formData.salary;
            if (formData.filingStatus) document.getElementById('filingStatus').value = formData.filingStatus;
            updatePreviousSessionDisplay();
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
    }
}

// Update previous session display
function updatePreviousSessionDisplay() {
    const savedData = localStorage.getItem('exerciseCalculatorData');
    const previousSessionDiv = document.getElementById('previousSession');
    const previousSessionData = document.getElementById('previousSessionData');
    
    if (savedData) {
        try {
            const formData = JSON.parse(savedData);
            const timestamp = formData.timestamp ? new Date(formData.timestamp).toLocaleString() : 'Unknown';
            
            const filingStatusLabels = {
                'single': 'Single',
                'married': 'Married Filing Jointly',
                'head': 'Head of Household'
            };
            
            previousSessionData.innerHTML = `
                <div><strong>Last saved:</strong> ${timestamp}</div>
                <div><strong>Total Options:</strong> ${formatNumber(parseFloat(formData.totalOptions) || 0)}</div>
                <div><strong>Exercise Price:</strong> ${formatCurrency(parseFloat(formData.exercisePrice) || 0)}</div>
                <div><strong>FMV:</strong> ${formatCurrency(parseFloat(formData.fmv) || 0)}</div>
                <div><strong>Salary:</strong> ${formatCurrency(parseFloat(formData.salary) || 0)}</div>
                <div><strong>Filing Status:</strong> ${filingStatusLabels[formData.filingStatus] || formData.filingStatus}</div>
            `;
            previousSessionDiv.style.display = 'block';
        } catch (e) {
            previousSessionDiv.style.display = 'none';
        }
    } else {
        previousSessionDiv.style.display = 'none';
    }
}

// Clear saved data
function clearSavedData() {
    if (confirm('Are you sure you want to clear all saved data?')) {
        localStorage.removeItem('exerciseCalculatorData');
        updatePreviousSessionDisplay();
        // Clear form fields
        document.getElementById('totalOptions').value = '';
        document.getElementById('exercisePrice').value = '';
        document.getElementById('fmv').value = '';
        document.getElementById('salary').value = '';
        document.getElementById('filingStatus').value = 'single';
    }
}

// Auto-save on input change
document.addEventListener('DOMContentLoaded', function() {
    loadFormData();
    
    // Add auto-save listeners
    ['totalOptions', 'exercisePrice', 'fmv', 'salary', 'filingStatus'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', saveFormData);
            // Debounce input events to avoid too many saves
            let timeout;
            element.addEventListener('input', function() {
                clearTimeout(timeout);
                timeout = setTimeout(saveFormData, 500);
            });
        }
    });
    
    // Add clear button listener
    const clearBtn = document.getElementById('clearDataBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearSavedData);
    }
});

document.getElementById('calculateBtn').addEventListener('click', function() {
    const totalOptions = parseFloat(document.getElementById('totalOptions').value);
    const exercisePrice = parseFloat(document.getElementById('exercisePrice').value);
    const fmv = parseFloat(document.getElementById('fmv').value);
    const salary = parseFloat(document.getElementById('salary').value);
    const filingStatus = document.getElementById('filingStatus').value;
    
    // Save form data
    saveFormData();
    
    // Validation
    if (!totalOptions || !exercisePrice || !fmv || !salary) {
        alert('Please fill in all fields');
        return;
    }
    
    if (fmv <= exercisePrice) {
        alert('FMV must be greater than exercise price');
        return;
    }
    
    // Calculate and display results
    const spreadPerShare = fmv - exercisePrice;
    const totalSpread = totalOptions * spreadPerShare;
    const { scenarios, recommendedShares } = generateScenarios(totalOptions, exercisePrice, fmv, salary, filingStatus);
    
    // Update summary cards
    document.getElementById('spreadPerShare').textContent = formatCurrency(spreadPerShare);
    document.getElementById('totalSpread').textContent = formatCurrency(totalSpread);
    
    if (recommendedShares > 0) {
        document.getElementById('recommendedShares').textContent = `${formatNumber(recommendedShares)} shares`;
    } else {
        document.getElementById('recommendedShares').textContent = '0 shares (AMT triggered even at 1 share)';
    }
    
    // Update scenarios table
    const tbody = document.getElementById('scenariosBody');
    tbody.innerHTML = '';
    
    scenarios.forEach(scenario => {
        const row = document.createElement('tr');
        if (scenario.shares === recommendedShares) {
            row.classList.add('recommended');
        }
        
        // Highlight rows that trigger AMT
        if (scenario.amt > 0 && scenario.shares !== recommendedShares) {
            row.style.backgroundColor = '#fff3e0';
        }
        
        row.innerHTML = `
            <td>${formatNumber(scenario.shares)}${scenario.shares === recommendedShares ? ' ⭐' : ''}${scenario.amt > 0 ? ' ⚠️' : ''}</td>
            <td class="currency">${formatCurrency(scenario.optionIncome)}</td>
            <td class="currency">${formatCurrency(scenario.totalIncome)}</td>
            <td class="currency">${formatCurrency(scenario.federalTax)}</td>
            <td class="currency">${formatCurrency(scenario.californiaTax)}</td>
            <td class="currency">${scenario.amt > 0 ? '<strong style="color: #f44336;">' + formatCurrency(scenario.amt) + '</strong>' : formatCurrency(scenario.amt)}</td>
            <td class="currency">${formatCurrency(scenario.totalTax)}</td>
            <td class="currency">${formatCurrency(Math.max(0, scenario.afterTaxValue))}</td>
            <td>${scenario.effectiveRate.toFixed(1)}%</td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Update tax breakdown for recommended scenario
    const recommendedScenario = scenarios.find(s => s.shares === recommendedShares);
    const baseline = calculateScenario(totalOptions, exercisePrice, fmv, salary, 0, filingStatus);
    
    const breakdown = document.getElementById('taxBreakdown');
    
    // Get detailed AMT breakdown
    const fedStandardDeduction = TAX_CONSTANTS.federal[filingStatus].standardDeduction;
    const salaryTaxableIncome = Math.max(0, salary - fedStandardDeduction);
    const amtBreakdown = getDetailedAMTBreakdown(salaryTaxableIncome, recommendedScenario.optionIncome, filingStatus);
    
    if (recommendedShares > 0) {
        breakdown.innerHTML = `
            <div class="tax-breakdown-item">
                <span class="tax-breakdown-label">Shares Exercised:</span>
                <span class="tax-breakdown-value">${formatNumber(recommendedShares)}</span>
            </div>
            <div class="tax-breakdown-item">
                <span class="tax-breakdown-label">Option Income (Spread):</span>
                <span class="tax-breakdown-value">${formatCurrency(recommendedScenario.optionIncome)}</span>
            </div>
            <div class="tax-breakdown-item">
                <span class="tax-breakdown-label">Federal Tax (on salary only):</span>
                <span class="tax-breakdown-value">${formatCurrency(recommendedScenario.federalTax)}</span>
            </div>
            <div class="tax-breakdown-item">
                <span class="tax-breakdown-label">California Tax (on salary only):</span>
                <span class="tax-breakdown-value">${formatCurrency(recommendedScenario.californiaTax)}</span>
            </div>
            <div class="tax-breakdown-item">
                <span class="tax-breakdown-label">AMT:</span>
                <span class="tax-breakdown-value" style="color: ${recommendedScenario.amt > 0 ? '#f44336' : '#4caf50'}; font-weight: bold;">
                    ${recommendedScenario.amt > 0 ? formatCurrency(recommendedScenario.amt) + ' ⚠️' : '$0.00 ✓'}
                </span>
            </div>
            <div class="tax-breakdown-item">
                <span class="tax-breakdown-label">Total Tax:</span>
                <span class="tax-breakdown-value">${formatCurrency(recommendedScenario.totalTax)}</span>
            </div>
            <div class="tax-breakdown-item">
                <span class="tax-breakdown-label">Net After-Tax Value:</span>
                <span class="tax-breakdown-value">${formatCurrency(Math.max(0, recommendedScenario.afterTaxValue))}</span>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: #f5f5f5; border-radius: 8px;">
                <h4 style="color: #667eea; margin-bottom: 15px;">📊 Detailed AMT Calculation</h4>
                
                <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
                        <span><strong>Gross Salary:</strong></span>
                        <span style="font-family: 'Courier New', monospace;">${formatCurrency(salary)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
                        <span style="padding-left: 20px;">Less: Standard Deduction</span>
                        <span style="font-family: 'Courier New', monospace;">- ${formatCurrency(fedStandardDeduction)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 2px solid #667eea; margin-bottom: 8px;">
                        <span><strong>Step 1:</strong> Regular Taxable Income (Salary only)</span>
                        <span style="font-family: 'Courier New', monospace; font-weight: bold;">${formatCurrency(amtBreakdown.step1RegularTaxableIncome)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
                        <span style="padding-left: 20px;">Calculation: ${formatCurrency(salary)} - ${formatCurrency(fedStandardDeduction)} = ${formatCurrency(amtBreakdown.step1RegularTaxableIncome)}</span>
                        <span style="font-family: 'Courier New', monospace;">- ${formatCurrency(fedStandardDeduction)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 2px solid #667eea; margin-bottom: 8px;">
                        <span><strong>Step 1:</strong> Regular Taxable Income (Salary only)</span>
                        <span style="font-family: 'Courier New', monospace; font-weight: bold;">${formatCurrency(amtBreakdown.step1RegularTaxableIncome)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
                        <span style="padding-left: 20px;">+ ISO Spread (not taxed as regular income)</span>
                        <span style="font-family: 'Courier New', monospace;">+ ${formatCurrency(recommendedScenario.optionIncome)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; background: #e3f2fd; margin: 8px -15px; padding: 8px 15px;">
                        <span><strong>Step 2:</strong> AMT Taxable Income</span>
                        <span style="font-family: 'Courier New', monospace; font-weight: bold;">${formatCurrency(amtBreakdown.step2AMTTaxableIncome)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
                        <span><strong>Step 3:</strong> Less AMT Exemption (${filingStatus === 'single' ? '$88,100' : filingStatus === 'married' ? '$176,200' : '$88,100'})</span>
                        <span style="font-family: 'Courier New', monospace;">- ${formatCurrency(amtBreakdown.step3AMTExemption)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; background: #fff3e0; margin: 8px -15px; padding: 8px 15px;">
                        <span><strong>Step 4:</strong> AMT Base (amount subject to AMT rates)</span>
                        <span style="font-family: 'Courier New', monospace; font-weight: bold;">${formatCurrency(amtBreakdown.step3AMTBase)}</span>
                    </div>
                </div>
                
                ${amtBreakdown.amtBracketBreakdown.length > 0 ? `
                <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                    <strong style="display: block; margin-bottom: 10px;">AMT Tax Calculation by Bracket:</strong>
                    ${amtBreakdown.amtBracketBreakdown.map(bracket => `
                        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0f0f0;">
                            <span>${bracket.range} @ ${bracket.rate}%</span>
                            <span style="font-family: 'Courier New', monospace;">
                                ${formatCurrency(bracket.amount)} × ${bracket.rate}% = ${formatCurrency(bracket.tax)}
                            </span>
                        </div>
                    `).join('')}
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; margin-top: 8px; border-top: 2px solid #667eea; font-weight: bold;">
                        <span>Total AMT Tax:</span>
                        <span style="font-family: 'Courier New', monospace;">${formatCurrency(amtBreakdown.step4AMTTax)}</span>
                    </div>
                </div>
                ` : ''}
                
                <div style="background: white; padding: 15px; border-radius: 6px;">
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
                        <span><strong>Step 5:</strong> Regular Federal Tax (on salary only)</span>
                        <span style="font-family: 'Courier New', monospace;">${formatCurrency(amtBreakdown.step5RegularTax)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
                        <span><strong>Step 5:</strong> AMT Tax</span>
                        <span style="font-family: 'Courier New', monospace;">${formatCurrency(amtBreakdown.step4AMTTax)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 12px 0; margin-top: 8px; border-top: 2px solid ${amtBreakdown.step5AMTOwed > 0 ? '#f44336' : '#4caf50'}; font-weight: bold; font-size: 1.1em;">
                        <span>AMT Owed (AMT Tax - Regular Tax):</span>
                        <span style="font-family: 'Courier New', monospace; color: ${amtBreakdown.step5AMTOwed > 0 ? '#f44336' : '#4caf50'};">
                            ${formatCurrency(amtBreakdown.step5AMTOwed)} ${amtBreakdown.step5AMTOwed > 0 ? '⚠️' : '✓'}
                        </span>
                    </div>
                    <p style="margin-top: 12px; padding: 10px; background: ${amtBreakdown.step5AMTOwed > 0 ? '#ffebee' : '#e8f5e9'}; border-radius: 6px; color: #555; font-size: 0.9em;">
                        ${amtBreakdown.step5AMTOwed > 0 
                            ? `⚠️ AMT is triggered because AMT tax (${formatCurrency(amtBreakdown.step4AMTTax)}) exceeds regular tax (${formatCurrency(amtBreakdown.step5RegularTax)}).`
                            : `✓ No AMT triggered. Regular tax (${formatCurrency(amtBreakdown.step5RegularTax)}) is greater than or equal to AMT tax (${formatCurrency(amtBreakdown.step4AMTTax)}).`}
                    </p>
                </div>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #4caf50;">
                <strong style="color: #2e7d32;">✓ No AMT Triggered</strong>
                <p style="margin-top: 8px; color: #555; font-size: 0.9em;">
                    You can exercise up to ${formatNumber(recommendedShares)} shares without triggering Alternative Minimum Tax.
                </p>
            </div>
        `;
    } else {
        breakdown.innerHTML = `
            <div style="padding: 20px; background: #fff3e0; border-radius: 8px; border-left: 4px solid #ff9800;">
                <strong style="color: #f57c00;">⚠️ AMT Warning</strong>
                <p style="margin-top: 10px; color: #555;">
                    Even exercising a single share would trigger AMT based on your current salary and option spread. 
                    Consider consulting a tax professional for strategies to minimize AMT impact.
                </p>
            </div>
        `;
    }
    
    // Show results section
    document.getElementById('resultsSection').style.display = 'block';
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

