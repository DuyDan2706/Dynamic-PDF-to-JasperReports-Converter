import { GlobalWorkerOptions } from 'pdfjs-dist/build/pdf';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

// Sử dụng worker giả lập
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js`;

// Hoặc tạo một worker giả lập
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.js`;