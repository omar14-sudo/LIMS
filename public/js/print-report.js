// public/js/print-report.js

// Helper function for auth headers
function authHeader() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// On page load
document.addEventListener('DOMContentLoaded', async () => {
  // Get sample ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const sampleId = urlParams.get('id');

  if (!sampleId) {
    alert('رقم العينة غير محدد');
    window.history.back();
    return;
  }

  try {
    // Fetch sample data
    const response = await fetch(`/api/samples/${sampleId}`, {
      headers: authHeader()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const sample = await response.json();
    displayReport(sample);
    generateQRCode(sample);
  } catch (error) {
    console.error('❌ Error fetching sample:', error);
    alert('حدث خطأ أثناء تحميل التقرير');
  }

  // Print button
  const btnPrint = document.getElementById('btnPrint');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  // Toggle header button
  const btnToggleHeader = document.getElementById('btnToggleHeader');
  const reportContainer = document.getElementById('reportContainer');
  if (btnToggleHeader) {
    btnToggleHeader.addEventListener('click', () => {
      console.log('Toggle header clicked'); // Debug log
      reportContainer.classList.toggle('hidden-header');
      console.log('Hidden-header class:', reportContainer.classList.contains('hidden-header')); // Debug log
      btnToggleHeader.innerHTML = reportContainer.classList.contains('hidden-header')
        ? '<i class="fas fa-eye"></i> إظهار الهيدر'
        : '<i class="fas fa-eye-slash"></i> إخفاء الهيدر';
    });
  } else {
    console.error('Toggle header button not found'); // Debug log
  }
});

// Display report data
function displayReport(sample) {
  document.getElementById('printSampleId').textContent = sample.id || '--';
  document.getElementById('printPatientName').textContent = sample.patient_name || '--';
  document.getElementById('printNationalId').textContent = sample.national_id || 'غير متوفر';
  document.getElementById('printTestName').textContent = sample.test_name || '--';
  document.getElementById('printCollectionDate').textContent = sample.collection_date
    ? new Date(sample.collection_date).toLocaleString('ar-EG')
    : '--';
  document.getElementById('printReportDate').textContent = new Date().toLocaleString('ar-EG');

  const resultsBody = document.getElementById('printResultsBody');
  const notesSection = document.getElementById('generalNotes');
  resultsBody.innerHTML = '';

  if (sample.status === 'completed' && sample.result_data) {
    try {
      const results = JSON.parse(sample.result_data);
      const normalRanges = getNormalRanges(sample.test_type_id);
      const units = getUnitForKey(sample.test_type_id);

      for (const [key, value] of Object.entries(results)) {
        if (key !== 'general_notes') {
          const row = document.createElement('tr');
          const normalRange = normalRanges[key] || '--';
          const unit = units[key] || '';

          row.innerHTML = `
			<td>${unit}</td>
			<td>${normalRange}</td>
			<td>${value}</td>
            <td>${key}</td>
            
          `;
          resultsBody.appendChild(row);
        }
      }

      // Display general notes
      if (results.general_notes) {
        notesSection.style.display = 'block';
        notesSection.innerHTML = `<strong>ملاحظات عامة:</strong> ${results.general_notes}`;
      } else {
        notesSection.style.display = 'none';
      }
    } catch (e) {
      console.error('Error parsing result_data:', e); // Debug log
      resultsBody.innerHTML = '<tr><td colspan="4" class="text-danger">Error loading results</td></tr>';
      notesSection.style.display = 'none';
    }
  } else {
    resultsBody.innerHTML = '<tr><td colspan="4" class="text-warning">Sample not yet completed</td></tr>';
    notesSection.style.display = 'none';
  }
}

// Generate QR Code
function generateQRCode(sample) {
  const qrData = `SAMPLE_ID:${sample.id}`;
  const qrCodeElement = document.getElementById('qrcode');
  qrCodeElement.innerHTML = '';

  new QRCode(qrCodeElement, {
    text: qrData,
    width: 100,
    height: 100,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
}

// Get units for test fields
function getUnitForKey(testTypeId) {
  return {
    // Complete Blood Count (CBC)
    'WBC': 'x10³/µL',
    'RBC': 'x10⁶/µL',
    'Hemoglobin': 'g/dL',
    'Hematocrit': '%',
    'Platelets': 'x10³/µL',
    'MCV': 'fL',
    'MCH': 'pg',
    'MCHC': 'g/dL',
    'RDW': '%',
    // Fasting Blood Sugar
    'Glucose': 'mg/dL',
    // HbA1c
    'HbA1c': '%',
    'Estimated Average Glucose': 'mg/dL',
    // Lipid Profile
    'Total Cholesterol': 'mg/dL',
    'HDL': 'mg/dL',
    'LDL': 'mg/dL',
    'Triglycerides': 'mg/dL',
    'VLDL': 'mg/dL',
    // Electrolytes
    'Sodium (Na)': 'mmol/L',
    'Potassium (K)': 'mmol/L',
    'Chloride (Cl)': 'mmol/L',
    'Bicarbonate (HCO3)': 'mmol/L',
    // Cardiac Enzymes
    'Troponin I': 'ng/mL',
    'CK-MB': 'U/L',
    'Myoglobin': 'ng/mL',
    // Coagulation Profile
    'PT': 'seconds',
    'PTT': 'seconds',
    'INR': '',
    'Fibrinogen': 'mg/dL',
    // Liver Function Tests
    'ALT': 'U/L',
    'AST': 'U/L',
    'Albumin': 'g/dL',
    'Total Bilirubin': 'mg/dL',
    'Direct Bilirubin': 'mg/dL',
    'ALP': 'U/L',
    'GGT': 'U/L',
    // Kidney Function Tests
    'Creatinine': 'mg/dL',
    'Urea': 'mg/dL',
    'Uric Acid': 'mg/dL',
    'BUN': 'mg/dL',
    'Sodium': 'mmol/L',
    'Potassium': 'mmol/L',
    // Amylase and Lipase
    'Amylase': 'U/L',
    'Lipase': 'U/L',
    // Thyroid Function Tests
    'TSH': 'µIU/mL',
    'T3': 'ng/dL',
    'T4': 'µg/dL',
    'Free T4': 'ng/dL',
    'Free T3': 'pg/mL',
    // Cortisol
    'Cortisol': 'µg/dL',
    // Testosterone
    'Total Testosterone': 'ng/dL',
    'Free Testosterone': 'pg/mL',
    // FSH and LH
    'FSH': 'mIU/mL',
    'LH': 'mIU/mL',
    // Prolactin
    'Prolactin': 'ng/mL',
    // Growth Hormone
    'GH': 'ng/mL',
    // Vitamin D
    '25-Hydroxy Vitamin D': 'ng/mL',
    // Vitamin B12
    'Vitamin B12': 'pg/mL',
    // Ferritin
    'Ferritin': 'ng/mL',
    // Serum Iron
    'Iron': 'µg/dL',
    'TIBC': 'µg/dL',
    'Transferrin Saturation': '%',
    // Calcium
    'Total Calcium': 'mg/dL',
    'Ionized Calcium': 'mmol/L',
    // Magnesium
    'Magnesium': 'mg/dL',
    // PSA
    'Total PSA': 'ng/mL',
    'Free PSA': 'ng/mL',
    // CRP
    'CRP': 'mg/L',
    // ESR
    'ESR': 'mm/hr',
    // HIV Test
    'HIV Result': '',
    'Antibody Status': '',
    // Hepatitis Panel
    'HBsAg': '',
    'Anti-HCV': '',
    'HAV IgM': '',
    'HBV Core Ab': '',
    // Rheumatoid Factor
    'RF': 'IU/mL',
    // ANA
    'ANA Titer': '',
    'Pattern': '',
    // Tuberculosis
    'TST Result': '',
    'Interferon-Gamma Release': '',
    // Urine Analysis
    'Color': '',
    'Appearance': '',
    'pH': '',
    'Protein': '',
    'Glucose': '',
    'RBC': '/HPF',
    'WBC': '/HPF',
    'Specific Gravity': '',
    'Ketones': '',
    // Stool Analysis
    'Consistency': '',
    'Mucus': '',
    'Blood': '',
    'Parasites': '',
    'Occult Blood': '',
    // Pregnancy Test
    'Result': '',
    'HCG Level': 'mIU/mL',
    // Semen Analysis
    'Volume': 'mL',
    'Sperm Count': 'million/mL',
    'Motility': '%',
    'Morphology': '%',
    'Liquefaction Time': 'minutes',
    // Blood Group
    'ABO Group': '',
    'Rh Factor': '',
    // G6PD
    'G6PD Activity': 'U/g Hb',
    // Thalassemia
    'Hemoglobin Electrophoresis': '',
    'HbA2': '%',
    'HbF': '%',
    // Anemia Panel
    'TIBC': 'µg/dL',
    // Random Blood Sugar
    'Glucose': 'mg/dL',
    // Thyroid Antibodies
    'Anti-TPO': 'IU/mL',
    'Anti-Thyroglobulin': 'IU/mL',
    // Comprehensive Kidney Profile
    'Electrolytes': ''
  };
}

// Get normal ranges for test fields
function getNormalRanges(testTypeId) {
  return {
    // Complete Blood Count (CBC)
    'WBC': '4.0 - 11.0',
    'RBC': '4.2 - 5.9',
    'Hemoglobin': '13.5 - 17.5',
    'Hematocrit': '41 - 53',
    'Platelets': '150 - 450',
    'MCV': '80 - 100',
    'MCH': '27 - 31',
    'MCHC': '32 - 36',
    'RDW': '11.5 - 14.5',
    // Fasting Blood Sugar
    'Glucose': '70 - 100',
    // HbA1c
    'HbA1c': '4.0 - 5.6',
    'Estimated Average Glucose': '68 - 114',
    // Lipid Profile
    'Total Cholesterol': '<200',
    'HDL': '>40',
    'LDL': '<100',
    'Triglycerides': '<150',
    'VLDL': '2 - 30',
    // Electrolytes
    'Sodium (Na)': '135 - 145',
    'Potassium (K)': '3.5 - 5.1',
    'Chloride (Cl)': '98 - 106',
    'Bicarbonate (HCO3)': '22 - 29',
    // Cardiac Enzymes
    'Troponin I': '<0.04',
    'CK-MB': '0 - 5',
    'Myoglobin': '28 - 72',
    // Coagulation Profile
    'PT': '11 - 13.5',
    'PTT': '25 - 35',
    'INR': '0.8 - 1.2',
    'Fibrinogen': '200 - 400',
    // Liver Function Tests
    'ALT': '7 - 56',
    'AST': '10 - 40',
    'Albumin': '3.5 - 5.0',
    'Total Bilirubin': '0.1 - 1.2',
    'Direct Bilirubin': '0 - 0.3',
    'ALP': '44 - 147',
    'GGT': '9 - 48',
    // Kidney Function Tests
    'Creatinine': '0.7 - 1.2',
    'Urea': '10 - 50',
    'Uric Acid': '3.4 - 7.0',
    'BUN': '7 - 20',
    'Sodium': '135 - 145',
    'Potassium': '3.5 - 5.1',
    // Amylase and Lipase
    'Amylase': '23 - 85',
    'Lipase': '0 - 160',
    // Thyroid Function Tests
    'TSH': '0.4 - 4.0',
    'T3': '80 - 200',
    'T4': '4.5 - 12.0',
    'Free T4': '0.8 - 1.8',
    'Free T3': '2.0 - 4.4',
    // Cortisol
    'Cortisol': '6 - 23',
    // Testosterone
    'Total Testosterone': '300 - 1000',
    'Free Testosterone': '50 - 210',
    // FSH and LH
    'FSH': '1.5 - 12.4',
    'LH': '1.7 - 8.6',
    // Prolactin
    'Prolactin': '4 - 15',
    // Growth Hormone
    'GH': '<5',
    // Vitamin D
    '25-Hydroxy Vitamin D': '30 - 100',
    // Vitamin B12
    'Vitamin B12': '200 - 900',
    // Ferritin
    'Ferritin': '30 - 400',
    // Serum Iron
    'Iron': '60 - 170',
    'TIBC': '240 - 450',
    'Transferrin Saturation': '20 - 50',
    // Calcium
    'Total Calcium': '8.5 - 10.2',
    'Ionized Calcium': '1.1 - 1.3',
    // Magnesium
    'Magnesium': '1.7 - 2.2',
    // PSA
    'Total PSA': '<4.0',
    'Free PSA': '0.0 - 0.5',
    // CRP
    'CRP': '<5.0',
    // ESR
    'ESR': '0 - 20',
    // HIV Test
    'HIV Result': 'Negative',
    'Antibody Status': 'Negative',
    // Hepatitis Panel
    'HBsAg': 'Negative',
    'Anti-HCV': 'Negative',
    'HAV IgM': 'Negative',
    'HBV Core Ab': 'Negative',
    // Rheumatoid Factor
    'RF': '<15',
    // ANA
    'ANA Titer': 'Negative',
    'Pattern': '',
    // Tuberculosis
    'TST Result': 'Negative',
    'Interferon-Gamma Release': 'Negative',
    // Urine Analysis
    'Color': 'Yellow',
    'Appearance': 'Clear',
    'pH': '4.5 - 8.0',
    'Protein': 'Negative',
    'Glucose': 'Negative',
    'RBC': '0 - 4',
    'WBC': '0 - 5',
    'Specific Gravity': '1.005 - 1.030',
    'Ketones': 'Negative',
    // Stool Analysis
    'Consistency': 'Formed',
    'Mucus': 'None',
    'Blood': 'None',
    'Parasites': 'None',
    'Occult Blood': 'Negative',
    // Pregnancy Test
    'Result': 'Negative',
    'HCG Level': '<5',
    // Semen Analysis
    'Volume': '1.5 - 5.0',
    'Sperm Count': '15 - 200',
    'Motility': '>40',
    'Morphology': '>4',
    'pH': '7.2 - 8.0',
    'Liquefaction Time': '15 - 30',
    // Blood Group
    'ABO Group': 'A/B/AB/O',
    'Rh Factor': 'Positive/Negative',
    // G6PD
    'G6PD Activity': '7 - 20',
    // Thalassemia
    'Hemoglobin Electrophoresis': 'Normal',
    'HbA2': '1.5 - 3.5',
    'HbF': '<2',
    // Anemia Panel
    'TIBC': '240 - 450',
    // Random Blood Sugar
    'Glucose': '70 - 140',
    // Thyroid Antibodies
    'Anti-TPO': '<34',
    'Anti-Thyroglobulin': '<40',
    // Comprehensive Kidney Profile
    'Electrolytes': 'Normal'
  };
}