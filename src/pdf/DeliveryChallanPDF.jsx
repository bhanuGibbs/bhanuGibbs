import { Page, Text, View, Image, Document, StyleSheet } from '@react-pdf/renderer';

const colors = {
  ink: '#172b3a',
  muted: '#526779',
  line: '#b8c8d2',
  pale: '#f1f6f7',
  accent: '#08756b',
  accentPale: '#e7f3f0',
  white: '#ffffff',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 126,
    paddingHorizontal: 24,
    paddingBottom: 100,
    fontFamily: 'Helvetica',
    color: colors.ink,
    fontSize: 8,
  },
  pageHeader: {
    position: 'absolute',
    top: 20,
    left: 24,
    right: 24,
    height: 92,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.accent,
  },
  identityRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  companyLogo: {
    position: 'absolute',
    left: 0,
    top: 2,
    width: 58,
    height: 46,
    objectFit: 'contain',
  },
  companyIdentity: {
    position: 'absolute',
    left: 64,
    right: 64,
    alignItems: 'center',
  },
  companyName: {
    width: '100%',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  companyAddress: {
    width: '100%',
    fontSize: 7,
    color: colors.muted,
    marginBottom: 2,
    textAlign: 'center',
  },
  companyContact: {
    width: '100%',
    fontSize: 7,
    color: colors.muted,
    textAlign: 'center',
  },
  documentHeading: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  docTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.accent,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  documentMeta: {
    flexDirection: 'row',
    gap: 18,
    marginLeft: 'auto',
  },
  documentMetaText: {
    fontSize: 8,
    color: colors.ink,
  },
  documentMetaStrong: {
    fontWeight: 'bold',
    color: colors.accent,
  },
  copyTag: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: colors.accentPale,
    color: colors.accent,
    fontSize: 6,
    fontWeight: 'bold',
  },
  gstinRow: {
    marginTop: 4,
  },
  gstinText: {
    fontSize: 7,
    color: colors.muted,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  detailPanel: {
    flex: 1,
    minWidth: 0,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sectionHeader: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: 5,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 3,
    alignItems: 'flex-start',
  },
  fieldLabel: {
    width: 67,
    flexShrink: 0,
    fontSize: 7,
    fontWeight: 'bold',
    color: colors.muted,
  },
  fieldValue: {
    flex: 1,
    minWidth: 0,
    fontSize: 7,
    color: colors.ink,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 9,
  },
  tableSuperHeader: {
    flexDirection: 'row',
    backgroundColor: colors.accentPale,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.ink,
  },
  tableRow: {
    flexDirection: 'row',
    minHeight: 21,
  },
  tableSuperCell: {
    paddingVertical: 3,
    borderRightWidth: 0.5,
    borderRightColor: colors.line,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.line,
    fontSize: 6,
    fontWeight: 'bold',
    color: colors.accent,
    textAlign: 'center',
  },
  tableHeaderCell: {
    paddingVertical: 5,
    paddingHorizontal: 2,
    borderRightWidth: 0.5,
    borderRightColor: '#526779',
    fontSize: 6,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
  },
  tableCell: {
    paddingVertical: 5,
    paddingHorizontal: 2,
    borderRightWidth: 0.5,
    borderRightColor: colors.line,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.line,
    fontSize: 6.5,
    color: colors.ink,
  },
  tableCellAlternate: {
    backgroundColor: '#f8fafb',
  },
  cellSno: { flex: 0.48, textAlign: 'center' },
  cellCrop: { flex: 1 },
  cellVariety: { flex: 1 },
  cellClass: { flex: 0.82 },
  cellLot: { flex: 0.72 },
  cellUnitSize: { flex: 0.62 },
  cellUnitSack: { flex: 0.72 },
  cellSack: { flex: 0.62 },
  cellQty: { flex: 0.72, textAlign: 'right' },
  cellValue: { flex: 0.82, textAlign: 'right' },
  packingGroup: { flex: 1.96 },
  footerColumns: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 8,
  },
  footerColumn: {
    flex: 1,
  },
  freightDetails: {
    minHeight: 58,
  },
  footerField: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  footerLabel: {
    width: 83,
    flexShrink: 0,
    fontSize: 7,
    fontWeight: 'bold',
    color: colors.muted,
  },
  footerValue: {
    flex: 1,
    fontSize: 7,
    color: colors.ink,
  },
  notes: {
    marginTop: 4,
    padding: 10,
    backgroundColor: colors.pale,
  },
  notesTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  noteItem: {
    fontSize: 7.5,
    lineHeight: 1.35,
    color: colors.ink,
    marginBottom: 3,
  },
  signatureSpacer: {
    flexGrow: 1,
  },
  signatureBlock: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  signatureLeft: {
    flex: 1,
    paddingRight: 20,
  },
  signatureRight: {
    flex: 1,
    alignItems: 'center',
  },
  companySeal: {
    width: 50,
    height: 44,
    marginTop: 3,
    objectFit: 'contain',
  },
  signatureLine: {
    width: '100%',
    fontSize: 7,
    color: colors.ink,
    paddingTop: 4,
    borderTopWidth: 0.75,
    borderTopColor: colors.line,
    textAlign: 'center',
  },
  authorisedSignatory: {
    fontSize: 7,
    color: colors.muted,
    marginTop: 3,
    textAlign: 'center',
  },
  repeatingTotals: {
    width: '100%',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.pale,
  },
  totalLabels: {
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 8,
    color: colors.ink,
  },
  totalValue: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.ink,
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.accent,
  },
  grandTotalText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.white,
  },
  grandTotalAmount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.white,
  },
  grandTotalZeroAmount: {
    color: colors.ink,
  },
  copyLabels: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  copyLabelText: {
    fontSize: 6,
    color: colors.muted,
  },
});

const getTotals = (data, items) => {
  const challan = data.challan || {};
  const totalQty = items.reduce((sum, item) => sum + Number(item.qtyKgs || 0), 0);
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.qtyKgs || 0) * Number(item.value || 0),
    0,
  );
  const shipping = Number(data.shipping ?? data.summary?.shipping ?? 0);
  const freight = Number(challan.freightAmount ?? data.summary?.freight ?? 0);

  return {
    totalQty,
    subtotal,
    shipping,
    grandTotal: subtotal + shipping ,
  };
};

function RepeatingTotals({ totals }) {
  return (
    <View style={styles.repeatingTotals} fixed>
      <View style={styles.totalLabels}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Quantity</Text>
          <Text style={styles.totalValue}>{totals.totalQty.toFixed(2)} kg</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Goods Value</Text>
          <Text style={styles.totalValue}>Rs. {totals.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Shipping</Text>
          <Text style={styles.totalValue}>Rs. {totals.shipping.toFixed(2)}</Text>
        </View>
      </View>
      <View style={styles.grandTotal}>
        <Text style={styles.grandTotalText}>GRAND TOTAL</Text>
        <Text
          style={[
            styles.grandTotalAmount,
            totals.grandTotal === 0 ? styles.grandTotalZeroAmount : null,
          ]}
        >
          Rs. {totals.grandTotal.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

function ChallanCopy({ data }) {
  const items = data.items || [];
  const challan = data.challan || {};
  const consignor = data.consignor || {};
  const consignee = data.consignee || {};
  const company = data.company || {};
  const issuedBy = data.quotation?.authorizedPerson || data.issuedBy || '';
  const dcNumber = challan.dcNumber || 'DC-PENDING';
  const dcDate = challan.date || '';
  const gstin = consignor.gstin || company.gstin || '';
  const filteredItems = items.filter(
    (item) => item.crop?.trim() || Number(item.qtyKgs || 0) > 0 || Number(item.value || 0) > 0,
  );
  const totals = getTotals(data, filteredItems);
  const pageHeight = Math.max(842, 650 + filteredItems.length * 32);

  return (
    <Page size={[595.28, pageHeight]} style={styles.page}>
      <View style={styles.pageHeader} fixed>
        <View style={styles.identityRow}>
          {company.logoData ? <Image src={company.logoData} style={styles.companyLogo} /> : null}
          <View style={styles.companyIdentity}>
            <Text style={styles.companyName}>{company.name || 'ADAM CROP SCIENCE PVT. LTD.'}</Text>
            {company.address ? <Text style={styles.companyAddress}>{company.address}</Text> : null}
            {company.phone || company.email ? (
              <Text style={styles.companyContact}>
                {company.phone ? `Phone: ${company.phone}` : ''}
                {company.phone && company.email ? ' | ' : ''}
                {company.email ? `Email: ${company.email}` : ''}
              </Text>
            ) : null}
          </View>
        </View>
        <Text style={styles.copyTag}>CHALLAN COPY</Text>
        <View style={styles.documentHeading}>
          <Text style={styles.docTitle}>DELIVERY CHALLAN</Text>
          <View style={styles.documentMeta}>
            <Text style={styles.documentMetaText}>
              <Text style={styles.documentMetaStrong}>DC No. </Text>{dcNumber}
            </Text>
            <Text style={styles.documentMetaText}>
              <Text style={styles.documentMetaStrong}>Date </Text>{dcDate}
            </Text>
          </View>
        </View>
        {gstin ? (
          <View style={styles.gstinRow}>
            <Text style={styles.gstinText}>GSTIN: {gstin}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailPanel}>
          <Text style={styles.sectionHeader}>Consignor</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Name</Text>
            <Text style={styles.fieldValue}>{consignor.name || company.name || ''}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>M. No.</Text>
            <Text style={styles.fieldValue}>{consignor.mNo || ''}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>C/o</Text>
            <Text style={styles.fieldValue}>{consignor.co || ''}</Text>
          </View>
        </View>
        <View style={styles.detailPanel}>
          <Text style={styles.sectionHeader}>Consignee</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Code</Text>
            <Text style={styles.fieldValue}>{consignee.code || ''}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Name</Text>
            <Text style={styles.fieldValue}>{consignee.name || ''}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Place</Text>
            <Text style={styles.fieldValue}>{consignee.place || ''}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Contact No.</Text>
            <Text style={styles.fieldValue}>{consignee.contactNo || ''}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>GST</Text>
            <Text style={styles.fieldValue}>{consignee.gst || ''}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Delivered to</Text>
            <Text style={styles.fieldValue}>{consignee.deliveredTo || ''}</Text>
          </View>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableSuperHeader} fixed>
          <Text style={[styles.tableSuperCell, styles.cellSno]}></Text>
          <Text style={[styles.tableSuperCell, styles.cellCrop]}></Text>
          <Text style={[styles.tableSuperCell, styles.cellVariety]}></Text>
          <Text style={[styles.tableSuperCell, styles.cellClass]}></Text>
          <Text style={[styles.tableSuperCell, styles.cellLot]}></Text>
          <Text style={[styles.tableSuperCell, styles.packingGroup]}>PACKING</Text>
          <Text style={[styles.tableSuperCell, styles.cellQty]}></Text>
          <Text style={[styles.tableSuperCell, styles.cellValue]}></Text>
        </View>
        <View style={styles.tableHeader} fixed>
          <Text style={[styles.tableHeaderCell, styles.cellSno]}>S.No.</Text>
          <Text style={[styles.tableHeaderCell, styles.cellCrop]}>Crop</Text>
          <Text style={[styles.tableHeaderCell, styles.cellVariety]}>Variety</Text>
          <Text style={[styles.tableHeaderCell, styles.cellClass]}>Class of Seed</Text>
          <Text style={[styles.tableHeaderCell, styles.cellLot]}>Lot No.</Text>
          <Text style={[styles.tableHeaderCell, styles.cellUnitSize]}>Unit Size</Text>
          <Text style={[styles.tableHeaderCell, styles.cellUnitSack]}>Unit Per Sack/Box</Text>
          <Text style={[styles.tableHeaderCell, styles.cellSack]}>Sack/Box</Text>
          <Text style={[styles.tableHeaderCell, styles.cellQty]}>Qty in Kgs</Text>
          <Text style={[styles.tableHeaderCell, styles.cellValue]}>Value (Rs.)</Text>
        </View>
        {filteredItems.map((item, index) => (
          <View style={styles.tableRow} key={item.id || index} wrap={false}>
            <Text style={[styles.tableCell, styles.cellSno, index % 2 ? styles.tableCellAlternate : null]}>{index + 1}</Text>
            <Text style={[styles.tableCell, styles.cellCrop, index % 2 ? styles.tableCellAlternate : null]}>{item.crop || ''}</Text>
            <Text style={[styles.tableCell, styles.cellVariety, index % 2 ? styles.tableCellAlternate : null]}>{item.variety || ''}</Text>
            <Text style={[styles.tableCell, styles.cellClass, index % 2 ? styles.tableCellAlternate : null]}>{item.seedClass || ''}</Text>
            <Text style={[styles.tableCell, styles.cellLot, index % 2 ? styles.tableCellAlternate : null]}>{item.lotNo || ''}</Text>
            <Text style={[styles.tableCell, styles.cellUnitSize, index % 2 ? styles.tableCellAlternate : null]}>{item.unitSize || ''}</Text>
            <Text style={[styles.tableCell, styles.cellUnitSack, index % 2 ? styles.tableCellAlternate : null]}>{item.unitPerSackBox || ''}</Text>
            <Text style={[styles.tableCell, styles.cellSack, index % 2 ? styles.tableCellAlternate : null]}>{item.sackBox || ''}</Text>
            <Text style={[styles.tableCell, styles.cellQty, index % 2 ? styles.tableCellAlternate : null]}>{Number(item.qtyKgs || 0).toFixed(2)}</Text>
            <Text style={[styles.tableCell, styles.cellValue, index % 2 ? styles.tableCellAlternate : null]}>{Number(item.value || 0).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footerColumns}>
        <View style={[styles.footerColumn, styles.freightDetails]}>
          <View style={styles.footerField}>
            <Text style={styles.footerLabel}>Seed License No.</Text>
            <Text style={styles.footerValue}>{challan.seedLicenseNo || ''}</Text>
          </View>
          <View style={styles.footerField}>
            <Text style={styles.footerLabel}>Carrier</Text>
            <Text style={styles.footerValue}>{challan.carrier || ''}</Text>
          </View>
          <View style={styles.footerField}>
            <Text style={styles.footerLabel}>Date of Despatch</Text>
            <Text style={styles.footerValue}>{challan.dateOfDespatch || ''}</Text>
          </View>
        </View>
        <View style={styles.footerColumn}>
          <View style={styles.footerField}>
            <Text style={styles.footerLabel}>Truck No.</Text>
            <Text style={styles.footerValue}>{challan.truckNo || ''}</Text>
          </View>
          <View style={styles.footerField}>
            <Text style={styles.footerLabel}>L.R. No.</Text>
            <Text style={styles.footerValue}>{challan.lrNo || ''}</Text>
          </View>
          <View style={styles.footerField}>
            <Text style={styles.footerLabel}>Way Bill No.</Text>
            <Text style={styles.footerValue}>{challan.wayBillNo || ''}</Text>
          </View>
          <View style={styles.footerField}>
            <Text style={styles.footerLabel}>Freight Amount</Text>
            <Text style={styles.footerValue}>
              {`Rs. ${Number(challan.freightAmount || 0).toFixed(2)}`}
            </Text>
          </View>
          <View style={styles.footerField}>
            <Text style={styles.footerLabel}>To Pay / Billed</Text>
            <Text style={styles.footerValue}>{challan.toPayToBeBilled || ''}</Text>
          </View>
        </View>
      </View>

      <RepeatingTotals totals={totals} />

      <View style={styles.notes} wrap={false}>
        <Text style={styles.notesTitle}>Notes</Text>
        <Text style={styles.noteItem}>1. Certified/Truthfully Labeled seeds for Agricultural Purpose</Text>
        <Text style={styles.noteItem}>2. Seed treated with poison. Do not use for Food, Feed or Oil Purpose</Text>
        <Text style={styles.noteItem}>3. For all disputes are subject to Hyderabad Judicial</Text>
        <Text style={styles.noteItem}>4. I confirm that the goods received by me as per the Delivery Challan are in good condition, and I am authorized to receive the same on behalf of the firm mentioned herein</Text>
      </View>

      <View style={styles.signatureSpacer} />
      <View style={styles.signatureBlock} wrap={false}>
        <View style={styles.signatureLeft}>
          {issuedBy ? <Text style={styles.authorisedSignatory}>Issued by: {issuedBy}</Text> : null}
          <Text style={styles.signatureLine}>Signature of the Party representative</Text>
        </View>
        <View style={styles.signatureRight}>
          <Text style={styles.signatureLine}>For {company.name || 'ADAM CROP SCIENCE PVT. LTD.'}</Text>
          {company.sealData ? <Image src={company.sealData} style={styles.companySeal} /> : null}
          <Text style={styles.authorisedSignatory}>Authorised Signatory</Text>
        </View>
      </View>

      <View style={styles.copyLabels} fixed>
        <Text style={styles.copyLabelText}>Delivery challan</Text>
        <Text
          style={styles.copyLabelText}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </View>
    </Page>
  );
}

const DeliveryChallanPDF = ({ data }) => (
  <Document>
    <ChallanCopy data={data} />
  </Document>
);

export default DeliveryChallanPDF;
