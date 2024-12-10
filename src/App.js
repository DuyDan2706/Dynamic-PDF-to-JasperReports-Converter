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

  const convertHTMLToJRXML = (htmlContent) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    const elements = doc.body.childNodes;
    const staticTextElements = [];

    let yOffset = 0; // Biến để quản lý vị trí y

    elements.forEach((element) => {
      if (element.nodeName === 'H1' || element.nodeName === 'H2') {
        const text = element.textContent.trim();
        staticTextElements.push(createTextElement(text, yOffset));
        yOffset += 20; // Tăng khoảng cách cho phần tử tiếp theo
      } else if (element.nodeName === 'P') {
        const text = element.textContent.trim();
        staticTextElements.push(createTextElement(text, yOffset));
        yOffset += 20;
      } else if (element.nodeName === 'TABLE') {
        const rows = element.querySelectorAll('tr');
        rows.forEach((row, rowIndex) => {
          const cells = row.querySelectorAll('td, th');
          cells.forEach((cell, cellIndex) => {
            const cellText = cell.textContent.trim();
            staticTextElements.push(createTextElement(cellText, yOffset, cellIndex));
          });
          yOffset += 20; // Tăng khoảng cách cho hàng tiếp theo
        });
      }
    });

    // Nếu không có nội dung nào, thêm nội dung mặc định
    if (staticTextElements.length === 0) {
      staticTextElements.push(createTextElement('No content found, displaying default text.', yOffset));
    }

    return {
      '@': {
        xmlns: 'http://jasperreports.sourceforge.net/jasperreports',
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:schemaLocation':
          'http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd',
        name: 'Converted Report',
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
          staticText: staticTextElements,
        },
      },
    };
  };

  const createTextElement = (text, yOffset, cellIndex = 0) => {
    return {
      reportElement: {
        '@': {
          x: (cellIndex * 80).toString(),
          y: yOffset.toString(),
          width: '80',
          height: '20',
        },
      },
      textElement: {
        font: { '@': { fontName: 'Arial' } },
      },
      text: { '#text': text || ' ' },
    };
  };

  const handleGenerateJRXML = () => {
    if (!htmlContent) {
      setError('Please upload an HTML file.');
      return;
    }

    const jrxml = convertHTMLToJRXML(htmlContent);
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
