export function csvCell(value:unknown){
  let text=String(value ?? "");
  if(/^[=+\-@]/.test(text))text=`'${text}`;
  return `"${text.replaceAll('"','""')}"`;
}

export function toCsv(rows:unknown[][]){
  return rows.map(row=>row.map(csvCell).join(",")).join("\r\n")+"\r\n";
}
