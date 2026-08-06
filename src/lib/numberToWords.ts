export function numberToWordsIndian(num: number): string {
  if (num === 0) return "Zero Rupees Only";
  
  const single = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const double = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  const formatTens = (num: number): string => {
    if (num < 10) return single[num];
    if (num < 20) return double[num - 10];
    return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + single[num % 10] : "");
  };

  const convertGroup = (num: number): string => {
    let str = "";
    if (num > 99) {
      str += single[Math.floor(num / 100)] + " Hundred ";
      num = num % 100;
    }
    if (num > 0) {
      str += formatTens(num) + " ";
    }
    return str;
  };

  let str = "";
  let crore = Math.floor(num / 10000000);
  num = num % 10000000;
  let lakh = Math.floor(num / 100000);
  num = num % 100000;
  let thousand = Math.floor(num / 1000);
  num = num % 1000;
  let remainder = Math.floor(num);

  if (crore > 0) {
    str += convertGroup(crore) + "Crore ";
  }
  if (lakh > 0) {
    str += convertGroup(lakh) + "Lakh ";
  }
  if (thousand > 0) {
    str += convertGroup(thousand) + "Thousand ";
  }
  if (remainder > 0) {
    str += convertGroup(remainder);
  }

  return str.trim() + " Rupees Only";
}
