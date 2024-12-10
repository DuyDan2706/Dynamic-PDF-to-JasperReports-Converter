import React, { useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/webpack';
import { parse } from 'js2xmlparser';

// Set worker source for pdfjs
GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/workers/pdf.worker.min.js`;

function App() {
  const [parsedData, setParsedData] = useState({ headers: [], rows: [] });

  // Handle file change and process the uploaded PDF
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const text = await extractTextFromPDF(file);
      const tableData = parseTableData(text);
      setParsedData(tableData);
    }
  };

  // Extract text content from PDF
  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument(arrayBuffer).promise;
    let text = '';

    for (let i = 0; i < pdf.numPages; i++) {
      const page = await pdf.getPage(i + 1);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(' ');
      text += pageText + '\n';
    }

    return text;
  };

  // Parse extracted text into table data
  const parseTableData = (text) => {
    const lines = text.split('\n').filter((line) => line.trim() !== '');
    const data = [];
    let headers = [];
    let rows = [];

    lines.forEach((line) => {
      const columns = line.split(/\s{2,}/).map((col) => col.trim());
      if (columns.length > 1) {
        data.push(columns);
      }
    });

    if (data.length > 0) {
      headers = data[0];
      rows = data.slice(1);
    }

    rows = rows.map((row) => {
      while (row.length < headers.length) row.push('');
      return row.slice(0, headers.length);
    });

    return { headers, rows };
  };

  // Generate JRXML layout
  const generateJRXML = (headers, rows) => {
    const fields = headers.map((header, index) => ({
      '@': { name: `Field${index + 1}`, class: 'java.lang.String' },
    }));
  
    const columnHeaderBand = {
      '@': { height: '40' },
      staticText: headers.map((header, index) => ({
        reportElement: {
          '@': {
            x: `${index * 100}`, // Adjust positioning for the column headers
            y: '0',
            width: '100',
            height: '30',
          },
        },
        text: { '#text': header || `Field${index + 1}` }, 
      })),
    };
  
    const detailBands = rows.map((row) => ({
      '@': { height: '25' },
      textField: row.map((cell, index) => ({
        reportElement: {
          '@': { x: `${index * 100}`, y: '0', width: '100', height: '20' },
        },
        box: {
          pen: { '@': { lineWidth: '0.3', lineStyle: 'Solid', lineColor: '#000000' } },
        },
        textElement: {
          font: { '@': { fontName: 'Arial' } },
        },
        textFieldExpression: { '#text': `$F{Field${index + 1}}` }, // Plain text without CDATA
      })),
    }));
  
    return {
      '@': {
        xmlns: 'http://jasperreports.sourceforge.net/jasperreports',
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:schemaLocation':
          'http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd',
        name: 'test',
        pageWidth: '1102',
        pageHeight: '842',
        columnWidth: '1062',
        leftMargin: '20',
        rightMargin: '20',
        topMargin: '20',
        bottomMargin: '20',
      },
      property: {
        '@': { name: 'com.jaspersoft.studio.data.defaultdataadapter', value: 'One Empty Record' },
      },
      field: fields,
      columnHeader: {
        band: columnHeaderBand,
      },
      detail: {
        band: detailBands,
      },
    };
  };
  

  // Download the JRXML file
  const downloadJRXML = (jrxml) => {
    const xml = parse('jasperReport', jrxml);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report.jrxml';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle JRXML generation
  const handleGenerateJRXML = () => {
    const { headers, rows } = parsedData;
    const jrxml = generateJRXML(headers, rows);
    downloadJRXML(jrxml);
  };

  return (
    <div>
      <h1>Dynamic PDF to JasperReports Converter</h1>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      {parsedData.headers.length > 0 && (
        <>
          <button onClick={handleGenerateJRXML}>Generate JRXML</button>
          <textarea
            value={JSON.stringify(parsedData, null, 2)}
            readOnly
            rows="10"
            cols="50"
          />
        </>
      )}
    </div>
  );
}

export default App;
