import {Page, Text, View, Document, StyleSheet, Image} from '@react-pdf/renderer';
import {calculateLineAmounts} from '../utils/calculations';
import {formatAppDate} from '../utils/dateFormat';

const styles = StyleSheet.create({
    page: {
        paddingTop: 135,
        paddingHorizontal: 30,
        paddingBottom: 52,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
        color: '#0f172a',
    },
    watermark:{
        position:'absolute',
        top:300,
        left:0,
        right:0,
        textAlign:'center',
        fontSize:34,
        fontWeight:'bold',
        color:'#e2e8f0',
        opacity:0.12,
        transform:'rotate(-30deg)',
    },
    // ── Header ──
    pageHeader: {
        position: 'absolute',
        top: 15,
        left: 30,
        right: 30,
        height: 110,
        borderBottomWidth: 2,
        borderBottomColor: '#047857',
    },
    headerRow: {
        flexDirection: 'row',
        height: 110,
        alignItems: 'flex-start',
    },
    // Left: Logo column
    logoColumn: {
        width: 155,
        flexShrink: 0,
        paddingTop: 4,
        alignItems: 'flex-start',
    },
    companyLogo: {
        width: 60,
        height: 50,
        objectFit: 'contain',
    },
    // Center: Company identity + title
    centerColumn: {
        flex: 1,
        paddingLeft: 8,
        paddingRight: 8,
        paddingTop: 2,
    },
    companyName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 3,
        textTransform: 'uppercase',
        textAlign: 'center',
        letterSpacing: 1,
    },
    companyAddress: {
        fontSize: 8,
        color: '#475569',
        marginBottom: 1,
        textAlign: 'center',
        lineHeight: 1.3,
    },
    companyContact: {
        fontSize: 8,
        color: '#475569',
        marginBottom: 8,
        textAlign: 'center',
        lineHeight: 1.3,
    },
    docTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#047857',
        letterSpacing: 1.5,
        textAlign: 'center',
        marginBottom: 2,
    },
    validUntilLine: {
        fontSize: 7.5,
        color: '#64748b',
        textAlign: 'center',
    },
    // Right: Document metadata
    rightColumn: {
        width: 155,
        flexShrink: 0,
        paddingTop: 4,
        alignItems: 'flex-end',
    },
    metaItem: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 4,
        alignItems: 'baseline',
    },
    metaLabel: {
        fontSize: 7.5,
        color: '#64748b',
        marginRight: 5,
    },
    metaValue: {
        fontSize: 8,
        fontWeight: '600',
        color: '#0f172a',
    },
    metaValueAccent: {
        fontSize: 8,
        fontWeight: '600',
        color: '#047857',
    },
    gstinBadge: {
        marginTop: 6,
        paddingVertical: 2,
        paddingHorizontal: 6,
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#bbf7d0',
        alignSelf: 'flex-end',
    },
    gstinBadgeText: {
        fontSize: 7,
        color: '#047857',
        fontWeight: 'bold',
    },
    // ── Detail Panels ──
    detailsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 14,
    },
    detailPanel: {
        flex: 1,
        minWidth: 0,
        padding: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#fafdfb',
        minHeight: 80,
    },
    sectionHeader: {
        fontSize: 8.5,
        fontWeight: 'bold',
        color: '#047857',
        marginBottom: 6,
        paddingBottom: 5,
        borderBottomWidth: 1.5,
        borderBottomColor: '#047857',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    fieldRow: {
        flexDirection: 'row',
        marginBottom: 3,
        alignItems: 'flex-start',
    },
    fieldLabel: {
        width: 67,
        flexShrink: 0,
        fontSize: 7.5,
        fontWeight: 'bold',
        color: '#64748b',
    },
    fieldValue: {
        flex: 1,
        minWidth: 0,
        fontSize: 7.5,
        color: '#0f172a',
    },
    // ── Table ──
    table: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 4,
        marginBottom: 12,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#047857',
    },
    tableRow: {
        flexDirection: 'row',
    },
    // Cell styles - matching DeliveryChallanPDF pattern exactly
    tableCell: {
        paddingVertical: 9,
        paddingHorizontal: 8,
        borderRightWidth: 0.5,
        borderRightColor: '#e5e7eb',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e5e7eb',
        fontSize: 8,
        color: '#0f172a',
    },
    tableCellAlternate: {
        backgroundColor: '#f9fafb',
    },
    tableHeaderCell: {
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRightWidth: 0.5,
        borderRightColor: '#065f46',
        fontSize: 7.5,
        fontWeight: 'bold',
        color: '#ffffff',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    // Column-specific flex and alignment
    tableSnoCell: {
        flex: 0.5,
        textAlign: 'center',
    },
    tableItemCell: {
        flex: 2.8,
    },
    tableQtyCell: {
        flex: 0.7,
        textAlign: 'center',
    },
    tableRateCell: {
        flex: 1.1,
        textAlign: 'right',
    },
    tableDiscountCell: {
        flex: 0.8,
        textAlign: 'center',
    },
    tableGstCell: {
        flex: 0.8,
        textAlign: 'center',
    },
    tableAmountCell: {
        flex: 1.2,
        textAlign: 'right',
    },
    // ── Summary ──
    summaryBox: {
        marginTop: 4,
        alignItems: 'flex-end',
    },
    summaryRow: {
        flexDirection: 'row',
        marginBottom: 4,
        width: 240,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 9,
        color: '#64748b',
    },
    summaryValue: {
        fontSize: 9,
        fontWeight: '500',
        color: '#0f172a',
    },
    totalSeparator: {
        width: 240,
        height: 1.5,
        backgroundColor: '#047857',
        marginBottom: 6,
        marginTop: 4,
    },
    totalRow: {
        flexDirection: 'row',
        width: 240,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: '#f0fdf4',
        borderWidth: 1.5,
        borderColor: '#047857',
        borderRadius: 3,
    },
    totalLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#047857',
    },
    totalValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#047857',
    },
    // ── Footer ──
    footer: {
        position: 'absolute',
        bottom: 19,
        left: 30,
        right: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        fontSize: 7.5,
        color: '#94a3b8',
        paddingTop: 6,
        borderTopWidth: 0.5,
        borderTopColor: '#e2e8f0',
    },
    // ── Signature ──
    signatureBlock: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingTop: 12,
        borderTopWidth: 0.5,
        borderTopColor: '#e2e8f0',
    },
    signatureLeft: {
        alignItems: 'flex-start',
    },
    signatureLine: {
        width: 180,
        height: 1,
        backgroundColor: '#94a3b8',
        marginTop: 8,
        marginBottom: 6,
    },
    signatureLabel: {
        fontSize: 8.5,
        color: '#64748b',
        fontWeight: '500',
    },
    authorizedName: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#0f172a',
        marginTop: 4,
    },
    signatureRight: {
        alignItems: 'flex-end',
    },
    stampBox: {
        width: 80,
        height: 80,
        borderWidth: 1.5,
        borderColor: '#94a3b8',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stampText: {
        fontSize: 7,
        color: '#94a3b8',
        textAlign: 'center',
    },
    // ── Terms ──
    terms: {
        marginTop: 16,
        marginBottom: 8,
    },
    termsText: {
        fontSize: 8.5,
        color: '#475569',
        lineHeight: 1.5,
    },
});

const getCurrencyFormat = (currencyCode = 'INR') => {
    switch ((currencyCode || 'INR').toUpperCase()) {
        case 'USD':
            return {label: '$', locale: 'en-US', code: 'USD'};
        case 'EUR':
            return {label: '€', locale: 'de-DE', code: 'EUR'};
        default:
            return {label: 'Rs.', locale: 'en-IN', code: 'INR'};
    }
};

const formatCurrency = (value, currencyCode = 'INR') => {
    const amount = Number(value || 0);
    const {locale} = getCurrencyFormat(currencyCode);
    return amount.toLocaleString(locale, {minimumFractionDigits: 2, maximumFractionDigits: 2});
};

const formatGrandTotal = (value, currencyCode = 'INR') => {
    const amount = Number(value || 0);
    const {label, locale} = getCurrencyFormat(currencyCode);
    return `${label} ${amount.toLocaleString(locale, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
};

const QuotationPDF = ({data}) => {
    const summary = data.summary || {};
    const items = data.items || [];
    const logo = data.company?.logo || '';
    const CompanyName = data.company?.name || 'KeelBill Ledger';
    const authorizedPerson = data.quotation?.authorizedPerson || 'KeelBill Ledger';
    const currencyCode = data.quotation?.currency || 'INR';
    const documentType = String(data.documentType || 'quotation').trim().toLowerCase();
    const isBilling = ['invoice', 'billing'].includes(documentType);

    const titleText = isBilling ? 'Invoice' : 'Quotation';
    const customerSectionTitle = isBilling ? 'Billing Details' : 'Customer Details';

    const companyRows = [
        {label: 'Name', value: data.company?.name},
        {label: 'Address', value: data.company?.address},
        {label: 'City', value: data.company?.city},
        {label: 'State', value: data.company?.state},
        {label: 'Pincode', value: data.company?.pincode},
        {label: 'GSTIN', value: data.company?.gstin},
        {label: 'Phone', value: data.company?.phone},
        {label: 'Email', value: data.company?.email},
    ].filter((row) => row.value && String(row.value).trim() !== '');

    const customerRows = [
        {label: 'Customer', value: data.customer?.name},
        {label: 'Company', value: data.customer?.companyName},
        {label: 'Address', value: data.customer?.address},
        {label: 'State', value: data.customer?.state},
        {label: 'City', value: data.customer?.city},
        {label: 'Pincode', value: data.customer?.pincode},
        {label: 'GST', value: data.customer?.gstNumber},
        {label: 'Phone', value: data.customer?.phone},
        {label: 'Email', value: data.customer?.email},
    ].filter((row) => row.value && String(row.value).trim() !== '');

    const filteredItems = items.filter(
        (item) => item.itemName?.trim() || Number(item.quantity || 0) > 0 || Number(item.rate || 0) > 0,
    );
    const documentNumber = data.quotation?.quotationNumber || 'QT-PENDING';
    const companyGstin = data.company?.gstin || '';
    
    // Build address parts for header
    const addressParts = [
        data.company?.address,
        data.company?.city,
        data.company?.state,
        data.company?.pincode,
        data.company?.country,
    ].filter(Boolean);
    const addressLine = addressParts.join(', ');
    
    // Build contact parts for header
    const contactParts = [];
    if (data.company?.phone) contactParts.push(`Phone: ${data.company.phone}`);
    if (data.company?.email) contactParts.push(`Email: ${data.company.email}`);
    const contactLine = contactParts.join(' | ');

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {[140, 300, 460, 620].map((top, index) => (
                    <Text
                        key={index}
                        fixed
                        style={[
                            styles.watermark,
                            {
                                top,
                                left: index % 2 === 0 ? -20 : 20,
                            },
                        ]}
                    >
                        {data.company?.name || 'KeelBill Ledger'}
                    </Text>
                ))}

                <View style={styles.pageHeader} fixed>
                    <View style={styles.headerRow}>
                        {/* Left: Logo */}
                        <View style={styles.logoColumn}>
                            {logo ? <Image src={logo} style={styles.companyLogo} /> : null}
                        </View>
                        {/* Center: Company identity + Title */}
                        <View style={styles.centerColumn}>
                            <Text style={styles.companyName}>{CompanyName}</Text>
                            {addressLine ? <Text style={styles.companyAddress}>{addressLine}</Text> : null}
                            {contactLine ? <Text style={styles.companyContact}>{contactLine}</Text> : null}
                            <Text style={styles.docTitle}>{titleText}</Text>
                            {data.quotation?.validUntil ? (
                                <Text style={styles.validUntilLine}>Valid until: {formatAppDate(data.quotation.validUntil, '')}</Text>
                            ) : null}
                        </View>
                        {/* Right: Document metadata */}
                        <View style={styles.rightColumn}>
                            <View style={styles.metaItem}>
                                <Text style={styles.metaLabel}>{isBilling ? 'Invoice No.' : 'Quotation No.'}</Text>
                                <Text style={styles.metaValueAccent}>{documentNumber}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Text style={styles.metaLabel}>Date</Text>
                                <Text style={styles.metaValue}>{formatAppDate(data.quotation?.quotationDate, '')}</Text>
                            </View>
                            {data.quotation?.validUntil ? (
                                <View style={styles.metaItem}>
                                    <Text style={styles.metaLabel}>Valid until</Text>
                                    <Text style={styles.metaValue}>{formatAppDate(data.quotation.validUntil, '')}</Text>
                                </View>
                            ) : null}
                            {companyGstin ? (
                                <View style={styles.gstinBadge}>
                                    <Text style={styles.gstinBadgeText}>GSTIN: {companyGstin}</Text>
                                </View>
                            ) : null}
                        </View>
                    </View>
                </View>

                <View style={styles.detailsRow}>
                    <View style={styles.detailPanel}>
                        <Text style={styles.sectionHeader}>Company Details</Text>
                        {companyRows.map((row) => (
                            <View style={styles.fieldRow} key={row.label}>
                                <Text style={styles.fieldLabel}>{row.label}</Text>
                                <Text style={styles.fieldValue}>{row.value}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={styles.detailPanel}>
                        <Text style={styles.sectionHeader}>{customerSectionTitle}</Text>
                        {customerRows.map((row) => (
                            <View style={styles.fieldRow} key={row.label}>
                                <Text style={styles.fieldLabel}>{row.label}</Text>
                                <Text style={styles.fieldValue}>{row.value}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, styles.tableSnoCell]}>SNO</Text>
                        <Text style={[styles.tableHeaderCell, styles.tableItemCell]}>Item</Text>
                        <Text style={[styles.tableHeaderCell, styles.tableQtyCell]}>Qty</Text>
                        <Text style={[styles.tableHeaderCell, styles.tableRateCell]}>Rate</Text>
                        <Text style={[styles.tableHeaderCell, styles.tableDiscountCell]}>Discount</Text>
                        <Text style={[styles.tableHeaderCell, styles.tableGstCell]}>GST</Text>
                        <Text style={[styles.tableHeaderCell, styles.tableAmountCell]}>Amount</Text>
                    </View>
                    {filteredItems.map((item, index) => {
                        const {amount} = calculateLineAmounts(item);
                        const altStyle = index % 2 ? styles.tableCellAlternate : null;
                        return (
                            <View style={styles.tableRow} key={item.id} wrap={false}>
                                <Text style={[styles.tableCell, styles.tableSnoCell, altStyle]}>{index + 1}</Text>
                                <Text style={[styles.tableCell, styles.tableItemCell, altStyle]}>{item.itemName}</Text>
                                <Text style={[styles.tableCell, styles.tableQtyCell, altStyle]}>{item.quantity}</Text>
                                <Text style={[styles.tableCell, styles.tableRateCell, altStyle]}>{formatCurrency(Number(item.rate || 0), currencyCode)}</Text>
                                <Text style={[styles.tableCell, styles.tableDiscountCell, altStyle]}>{Number(item.discount || 0)}%</Text>
                                <Text style={[styles.tableCell, styles.tableGstCell, altStyle]}>{Number(item.gst || 0)}%</Text>
                                <Text style={[styles.tableCell, styles.tableAmountCell, altStyle]}>{formatCurrency(amount, currencyCode)}</Text>
                            </View>
                        );
                    })}
                </View>

                <View style={styles.summaryBox} wrap={false}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(summary.subtotal, currencyCode)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Discount</Text>
                        <Text style={styles.summaryValue}>-{formatCurrency(summary.discount, currencyCode)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>GST Total</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(summary.gstTotal, currencyCode)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Shipping</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(summary.shipping, currencyCode)}</Text>
                    </View>
                    <View style={styles.totalSeparator} />
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Grand Total</Text>
                        <Text style={styles.totalValue}>{formatGrandTotal(summary.grandTotal, currencyCode)}</Text>
                    </View>
                </View>

                {data.quotation?.terms && String(data.quotation.terms).trim() !== '' ? (
                    <View style={styles.terms}>
                        <Text style={styles.sectionHeader}>Terms & Conditions</Text>
                        <Text style={styles.termsText}>{data.quotation.terms}</Text>
                    </View>
                ) : null}

                <View style={styles.signatureBlock} wrap={false}>
                    <View style={styles.signatureLeft}>
                        {data.signature?.preview ? (
                            <>
                                <Image src={data.signature.preview}
                                       style={{width: 120, height: 50, objectFit: 'contain'}}/>
                                <View style={styles.signatureLine}/>
                                <Text style={styles.signatureLabel}>Authorized Signatory</Text>
                                <Text style={styles.authorizedName}>Issued by: {authorizedPerson}</Text>
                            </>
                        ) : (
                            <>
                                <View style={styles.signatureLine}/>
                                <Text style={styles.signatureLabel}>Authorized Signatory</Text>
                                <Text style={styles.authorizedName}>Issued by: {authorizedPerson}</Text>
                            </>
                        )}
                    </View>
                    <View style={styles.signatureRight}>
                        <View style={styles.stampBox}>
                            <Text style={styles.stampText}>Company Stamp</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.footer} fixed>
                    <Text>Confidential document ·</Text>
                    <Text style={{fontSize: 9, color: '#64748b', marginTop: 8}}>Generated using KeelBill Ledger</Text>
                    <Text render={({pageNumber, totalPages}) => `${pageNumber} / ${totalPages}`}/>
                </View>
            </Page>
        </Document>
    );
};

export default QuotationPDF;
