import React, { useState } from 'react';
import { parse } from 'js2xmlparser';

function App() {
  const [htmlContent, setHtmlContent] = useState('');
  const [jrxmlGenerated, setJrxmlGenerated] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setHtmlContent(e.target.result);
      };
      reader.onerror = () => {
        setError('Error reading file');
      };
      reader.readAsText(file);
    }
  };

  const convertHTMLTableToJRXML = (htmlContent) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const rows = doc.querySelectorAll('table tr');

    const bands = Array.from(rows).map((row, rowIndex) => {
      const cells = row.querySelectorAll('td, th'); // Include <th> for headers
      return Array.from(cells).map((cell, cellIndex) => ({
        reportElement: {
          '@': {
            x: (cellIndex * 100).toString(),
            y: (rowIndex * 20).toString(),
            width: '100',
            height: '20',
          },
        },
        textElement: {
          font: { '@': { fontName: 'Arial' } },
        },
        text: { '#text': cell.textContent },
      }));
    });

    return {
      '@': {
        xmlns: 'http://jasperreports.sourceforge.net/jasperreports',
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:schemaLocation':
          'http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd',
        name: 'Converted Table Report',
        pageWidth: '595',
        pageHeight: '842',
        columnWidth: '515',
        leftMargin: '20',
        rightMargin: '20',
        topMargin: '20',
        bottomMargin: '20',
      },
      detail: {
        band: {
          '@': { height: '800' },
          staticText: bands.flat(),
        },
      },
    };
  };

  const handleGenerateJRXML = () => {
    if (!htmlContent) {
      setError('Please upload an HTML file containing a table.');
      return;
    }

    const jrxml = convertHTMLTableToJRXML(htmlContent);
    setJrxmlGenerated(jrxml);
    downloadJRXML(jrxml);
  };

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

  return (
    <div>
      <h1>HTML File to JasperReports Converter</h1>
      <input type="file" accept=".html" onChange={handleFileChange} />
      <button onClick={handleGenerateJRXML}>Generate JRXML</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {jrxmlGenerated && (
        <textarea
          value={JSON.stringify(jrxmlGenerated, null, 2)}
          readOnly
          rows="10"
          cols="50"
          style={{ marginTop: '20px', width: '100%' }}
        />
      )}
    </div>
  );
}

export default App;
