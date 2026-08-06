import React from "react";
import { Company, InvoiceData } from "@/types";
import { numberToWordsIndian } from "@/lib/numberToWords";
import { useCompanyStore } from "@/stores";

interface InvoicePreviewProps {
  data: InvoiceData;
}

export function InvoicePreview({ data }: InvoicePreviewProps) {
  const { company } = useCompanyStore();
  
  let bankInfo: any = {};
  if (company?.bankDetails) {
    try {
      bankInfo = JSON.parse(company.bankDetails);
    } catch(e) {}
  }

  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.ceil(data.items.length / ITEMS_PER_PAGE) || 1;

  return (
    <div id="pdf-preview-container" className="invoice-print-area flex flex-col gap-8 pb-8">
      {Array.from({ length: totalPages }).map((_, pageIndex) => {
        const isLastPage = pageIndex === totalPages - 1;
        const pageItems = data.items.slice(pageIndex * ITEMS_PER_PAGE, (pageIndex + 1) * ITEMS_PER_PAGE);

        return (
          <div
            key={pageIndex}
            className="bg-white w-[800px] text-black font-sans text-xs flex flex-col shadow-2xl relative"
            style={{ minHeight: "1131px", padding: "40px" }} // Approx A4 aspect ratio padding
          >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="w-1/3">
          {totalPages > 1 && <span className="text-[10px]">Page {pageIndex + 1} of {totalPages}</span>}
        </div>
        <div className="w-1/3 text-center">
          <h1 className="font-bold text-lg leading-tight">Tax Invoice</h1>
          <div className="text-[10px]">Bill of Supply</div>
        </div>
        <div className="w-1/3 text-right italic text-[10px] font-medium pt-1">
          (ORIGINAL FOR RECIPIENT)
        </div>
      </div>

      {/* Main Container - Bordered */}
      <div className="border border-black flex-1 flex flex-col">
        {/* Top Section - Split 50/50 - Only on first page */}
        {pageIndex === 0 && (
          <div className="flex border-b border-black min-h-[280px]">
            {/* Left Side - Consignee & Buyer */}
            <div className="w-[50%] border-r border-black flex flex-col">
              {/* Block 1: Company Details (Top Left) */}
              <div className="p-1 border-b border-black flex flex-col">
              <strong className="text-xs uppercase">{company?.name || 'Company Name'}</strong>
              <p className="text-[10px] leading-tight flex-1 whitespace-pre-line mt-1">
                {company?.address || 'Company Address'}
              </p>
              {company?.email && (
                <div className="text-[10px] mt-1">E-MAIL : {company.email}</div>
              )}
            </div>

            {/* Block 2: Consignee (Ship to) */}
            <div className="p-1 border-b border-black flex flex-col">
              <span className="text-[9px] mb-1">Consignee (Ship to)</span>
              <strong className="text-[11px] whitespace-pre-line">
                {data.consigneeName || '-'}
              </strong>
              <div className="grid grid-cols-[80px_1fr] text-[10px] mt-auto">
                <span>GSTIN/UIN</span>
                <span>: {data.consigneeGst || '-'}</span>
                <span>State Name</span>
                <span>: {data.consigneeState || '-'}</span>
              </div>
            </div>

            {/* Block 3: Buyer (Bill to) */}
            <div className="p-1 flex flex-col flex-1">
              <span className="text-[9px] mb-1">Buyer (Bill to)</span>
              <strong className="text-[11px] leading-tight whitespace-pre-line">
                {data.buyerName || '-'}
              </strong>
              <p className="text-[10px] leading-tight mt-1 flex-1 whitespace-pre-line">
                {data.buyerAddress || ''}
              </p>
              <div className="grid grid-cols-[80px_1fr] text-[10px] mt-1">
                <span>GSTIN/UIN</span>
                <span>: {data.buyerGst || '-'}</span>
                <span>State Name</span>
                <span>: {data.buyerState || '-'}</span>
              </div>
            </div>
          </div>

          {/* Right Side - Invoice Details Grid */}
          <div className="w-[50%] grid grid-cols-2 grid-rows-7">
            {/* Row 1 */}
            <div className="border-b border-r border-black p-1 flex flex-col justify-start">
              <span className="text-[9px]">Invoice No.</span>
              <strong className="mt-1">{data.invoiceNumber || "-"}</strong>
            </div>
            <div className="border-b border-black p-1 flex flex-col justify-start">
              <span className="text-[9px]">Dated</span>
              <strong className="mt-1">{data.date || "-"}</strong>
            </div>

            {/* Row 2 */}
            <div className="border-b border-r border-black p-1 flex flex-col justify-start">
              <span className="text-[9px]">Delivery Note</span>
              <strong className="mt-1">{data.deliveryNote || ""}</strong>
            </div>
            <div className="border-b border-black p-1 flex flex-col justify-start">
              <span className="text-[9px]">Mode/Terms of Payment</span>
              <strong className="mt-1">{data.modeOfPayment || ""}</strong>
            </div>

            {/* Row 3 */}
            <div className="border-b border-r border-black p-1 flex flex-col justify-start">
              <span className="text-[9px]">Reference No. & Date.</span>
              <strong className="mt-1">{data.referenceNo || ""}</strong>
            </div>
            <div className="border-b border-black p-1 flex flex-col justify-start">
              <span className="text-[9px]">Other References</span>
              <strong className="mt-1">{data.otherReferences || ""}</strong>
            </div>

            {/* Row 4 */}
            <div className="border-b border-r border-black p-1 flex flex-col justify-start">
              <span className="text-[9px]">Buyer's Order No.</span>
              <strong className="mt-1">{data.buyersOrderNo || ""}</strong>
            </div>
            <div className="border-b border-black p-1 flex flex-col justify-start">
              <span className="text-[9px]">Dated</span>
              <strong className="mt-1">{data.buyersOrderDate || ""}</strong>
            </div>

            {/* Row 5 */}
            <div className="border-b border-r border-black p-1 flex flex-col justify-start">
              <span className="text-[9px]">Dispatch Doc No.</span>
              <strong className="mt-1">{data.dispatchDocNo || ""}</strong>
            </div>
            <div className="border-b border-black p-1 flex flex-col justify-start">
              <span className="text-[9px]">Delivery Note Date</span>
              <strong className="mt-1">{data.deliveryNoteDate || ""}</strong>
            </div>

            {/* Row 6 */}
            <div className="border-b border-r border-black p-1 flex flex-col justify-start">
              <span className="text-[9px]">Dispatched through</span>
              <strong className="mt-1">{data.dispatchedThrough || ""}</strong>
            </div>
            <div className="border-b border-black p-1 flex flex-col justify-start">
              <span className="text-[9px]">Destination</span>
              <strong className="mt-1">{data.destination || ""}</strong>
            </div>

            {/* Row 7 (spans full) */}
            <div className="col-span-2 p-1 flex flex-col justify-start">
              <span className="text-[9px]">Terms of Delivery</span>
              <strong className="text-[10px] mt-1 whitespace-pre-line">{data.termsOfDelivery || ""}</strong>
            </div>
          </div>
          </div>
        )}

        {/* Items Table */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex border-b border-black text-[10px]">
            <div className="w-8 border-r border-black p-1 text-center font-normal flex items-center justify-center">Sl<br/>No.</div>
            <div className="flex-1 border-r border-black p-1 text-center font-normal flex items-center justify-center">Description of<br/>Services</div>
            <div className="w-16 border-r border-black p-1 text-center font-normal flex items-center justify-center">HSN/SAC</div>
            <div className="w-16 border-r border-black p-1 text-center font-normal flex items-center justify-center">Quantity</div>
            <div className="w-16 border-r border-black p-1 text-center font-normal flex items-center justify-center">Rate</div>
            <div className="w-8 border-r border-black p-1 text-center font-normal flex items-center justify-center">per</div>
            <div className="w-24 p-1 text-center font-normal flex items-center justify-center">Amount</div>
          </div>

          {/* Body */}
          <div className="flex-1 flex relative">
             {/* Column Borders Layer - stretches full height automatically */}
             <div className="absolute inset-0 flex pointer-events-none">
                <div className="w-8 border-r border-black"></div>
                <div className="flex-1 border-r border-black"></div>
                <div className="w-16 border-r border-black"></div>
                <div className="w-16 border-r border-black"></div>
                <div className="w-16 border-r border-black"></div>
                <div className="w-8 border-r border-black"></div>
                <div className="w-24"></div>
             </div>

             {/* Content Layer */}
             <div className="w-full flex flex-col z-10">
               {pageItems.map((item, index) => (
                 <div key={item.id} className="flex align-top">
                   <div className="w-8 p-1 text-center">{pageIndex * ITEMS_PER_PAGE + index + 1}</div>
                   <div className="flex-1 p-1">
                     <strong>{item.description}</strong>
                   </div>
                   <div className="w-16 p-1 text-center">{item.hsn}</div>
                   <div className="w-16 p-1 text-center font-bold">{item.quantity}</div>
                   <div className="w-16 p-1 text-right">{Number(item.rate).toFixed(2)}</div>
                   <div className="w-8 p-1 text-center text-[10px]">{item.unit || ''}</div>
                   <div className="w-24 p-1 text-right font-bold">{Number(item.amount).toFixed(2)}</div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Total Row - Only on last page */}
        {isLastPage && (
          <div className="flex border-t border-b border-black font-bold">
            <div className="flex-1 text-right p-1 pr-4 border-r border-black">
              Total
            </div>
            <div className="w-24 p-1 text-right">₹ {data.total.toFixed(2)}</div>
          </div>
        )}

        {/* Footer Section - Only on last page */}
        {isLastPage && (
          <div className="flex flex-col text-[10px]">
            <div className="flex flex-col p-1 border-b border-black border-opacity-20 mb-2">
              <div className="flex justify-between">
                <span className="text-[10px]">Amount Chargeable (in words)</span>
                <span className="text-[10px] italic pr-2">E. & O.E</span>
              </div>
              <strong className="text-[11px] mt-1 pl-2 font-bold">{numberToWordsIndian(data.total)}</strong>
            </div>

            <div className="flex">
              {/* Left Side */}
              <div className="w-1/2 p-1 flex flex-col justify-end pb-2">
                <div className="mb-1">
                  <span className="underline text-[10px]">Declaration</span>
                  <p className="text-[10px] leading-tight mt-1">
                    We declare that this invoice shows the actual price of the goods<br/>
                    described and that all particulars are true and correct.
                  </p>
                </div>
              </div>

              {/* Right Side */}
              <div className="w-1/2 flex flex-col">
                <div className="text-right p-1 pr-2 pb-0">Company's Bank Details</div>
                
                <div className="pl-4 pb-1 grid grid-cols-[110px_1fr] text-[10px] leading-tight">
                  <span>A/c Holder's Name</span><span>: {bankInfo.accountName}</span>
                  <span>Bank Name</span><span>: <strong>{bankInfo.bankName}</strong></span>
                  <span>A/c No.</span><span>: {bankInfo.accountNumber}</span>
                  <span>Branch & IFS Code</span><span>: {bankInfo.ifscCode}</span>
                </div>

                {/* Signature Box */}
                <div className="border-t border-l border-black flex-1 min-h-[96px] flex w-full relative overflow-hidden">
                  {/* Left 30% */}
                  <div className="w-[30%] border-r border-black border-opacity-20 flex flex-col items-start justify-center p-2">
                    <span className="text-[8px] uppercase text-black/60 font-semibold tracking-wider">Digitally Signed By</span>
                    <strong className="text-[11px] mt-1 break-words w-full text-black/90">{company?.digitalSignatureName || "-"}</strong>
                  </div>
                  {/* Right 70% */}
                  <div className="w-[70%] flex flex-col items-center justify-end p-2 relative overflow-visible">
                    <strong className="text-[10px] font-bold text-black mb-1">AUTHORIZED SIGNATURE</strong>
                    {company?.signature ? (
                      <img 
                        src={company.signature} 
                        alt="Authorized Signature" 
                        className="absolute inset-0 w-full h-full object-contain mix-blend-multiply pointer-events-none" 
                        style={{
                          transform: `translate(${company?.signatureOffsetX || 0}px, ${(company?.signatureOffsetY || 0) - 8}px) scale(1.35)`
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Very Bottom text */}
      <div className="text-center text-[9px] mt-2 italic">
        This is a Computer Generated Invoice
      </div>
      </div>
        );
      })}
    </div>
  );
}
