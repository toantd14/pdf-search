const fs = require('fs');
const pdf = require('pdf-parse');

// Load the PDF file
const pdfFilePath = './data/sao_ke_bao_so_3_2024.pdf';


// Function to parse and remove details from a transaction string
const parseAndRemove = (transactionString) => {
    const dateRegex = /\d{2}\/\d{2}\/\d{4}/g;
    const amountRegex = /[0-9,.]+(?: VND)/g;
    const amountNoVNDRegex = /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b/g;

    // Remove dates from the string
    let remainingString = transactionString;

    // Extract dates and amounts
    const dates = transactionString.match(dateRegex) || [];
    dates.forEach(date => {
        remainingString = remainingString.replace(date, '');
    });

    // Remove amounts with "VND" from the string
    const amountsWithVND = remainingString.match(amountRegex) || [];
    amountsWithVND.forEach(amount => {
        remainingString = remainingString.replace(amount, '');
    });

    // Find the first alphabetic character in the remaining string to determine the start of the description
    const firstAlphaIndex = remainingString.search(/[a-zA-Z]/);

    // Remove additional "amounts" which are not followed by "VND"
    // const amountsNoVND = remainingString.match(amountNoVNDRegex) || [];
    // amountsNoVND.forEach(amount => {
    //     remainingString = remainingString.replace(amount, '');
    // });
    let amountsNoVND = [];
    if (firstAlphaIndex !== -1) {
        // Extract amounts before the first alphabetic character
        const stringBeforeAlpha = remainingString.slice(0, firstAlphaIndex).trim();
        amountsNoVND = stringBeforeAlpha.match(amountNoVNDRegex) || [];
        amountsNoVND.forEach(amount => {
            remainingString = remainingString.replace(amount, '');
        });
    }

    // Extract remaining description
    const description = remainingString.trim();
    // const description = firstAlphaIndex !== -1 ? remainingString.slice(firstAlphaIndex).trim() : '';


    // Assuming the first amount is the original transaction amount and second amount is the debit amount
    const transactionDetails = {
        "Ngày giao dịch": dates[0] || '',
        "Ngày cập nhật hệ thống": dates[1] || '',
        "Số tiền giao dịch gốc": amountsWithVND[0] || '',
        "Ghi nợ (VND)": amountsNoVND[0] || '---',
        "Ghi có (VND)":  amountsNoVND[1] || '---',
        "Diễn giải giao dịch": description
    };

    return transactionDetails;
};

// Function to extract and format transaction details
const extractTransactionDetails = (text, keyword) => {
    const lines = text.split('\n');
    let result = [];
    let recording = false;
    let transactionLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Transaction Description')) {
            recording = true;
            continue;
        }
        if (lines[i].includes('Tổng ghi nợ trong kỳ')) {
            recording = false;
            break;
        }

        if (recording) {
            transactionLines.push(lines[i]);

            // Collect two lines per transaction
            if (transactionLines.length === 2) {
                const [line1, line2] = transactionLines;
                const combinedLine = line1 + line2; // Combine both lines for processing

                // Check if the keyword is present in either line
                if (combinedLine.includes(keyword)) {
                    // Extract transaction details
                    const transactionDetails = parseAndRemove(combinedLine);

                    result.push(transactionDetails);
                }
                transactionLines = []; // Clear for the next transaction
            }
        }
    }
    return result;
};

// Function to search for a keyword in the PDF text
const searchInPdf = async (keyword) => {
    if (!fs.existsSync(pdfFilePath)) {
        throw new Error('File not found');
    }

    const dataBuffer = fs.readFileSync(pdfFilePath);

    try {
        const data = await pdf(dataBuffer);
        const text = data.text;

        // Extract transaction details based on the keyword search
        return extractTransactionDetails(text, keyword);

    } catch (error) {
        throw new Error('Error reading the PDF:', error);
    }
};

// Export functions for use in other files
module.exports = {
    searchInPdf
};
