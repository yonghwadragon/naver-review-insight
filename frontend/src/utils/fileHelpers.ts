import * as XLSX from 'xlsx';
import { Review } from '../types';

export const parseReviewFile = async (file: File): Promise<Review[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        // CSV 컬럼명을 우리 앱의 Review 타입으로 매핑
        const reviews: Review[] = jsonData.map((row: any, index: number) => ({
          id: String(index),
          user: row['nickname'] || row['작성자'] || 'Anonymous',
          rating: parseInt(row['rating'] || row['평점'] || '5'),
          date: row['date'] || row['날짜'] || '',
          content: row['content'] || row['내용'] || '',
        }));

        resolve(reviews);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};