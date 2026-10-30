import {Page, Text, View, Document, StyleSheet, Image} from '@react-pdf/renderer';
import {calculateLineAmounts} from '../utils/calculations';
import {formatAppDate} from '../utils/dateFormat';

const styles = StyleSheet.create({
    page: {
        paddingTop: 38,
        paddingHorizontal: 40,
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
        color:'#C8CDD2',
        opacity:0.20,
        transform:'rotate(-30deg)',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 14,
        marginBottom: 18,
        borderBottomWidth: 2,
        borderBottomColor: '#0f766e',
    },
    brand: {
        flexGrow: 1,
        flexShrink: 1,
        paddingRight: 16,
    },
    documentMeta: {
        alignItems: 'flex-end',
        flexShrink: 0,
        maxWidth: 190,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 10,
        color: '#64748b',
        lineHeight: 1.35,
    },
    card: {
        borderWidth: 1,
        borderColor: '#dbe4ea',
        borderRadius: 7,
        padding: 11,
        backgroundColor: '#f8fafc',
        flex: 1,
        minWidth: 0,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: 12,
        marginBottom: 18,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0f766e',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 5,
    },
    label: {
        fontSize: 8,
        color: '#64748b',
        width: '34%',
        paddingRight: 5,
    },
    value: {
        fontSize: 8,
        color: '#0f172a',
        width: '66%',
        lineHeight: 1.3,
    },
    table: {
        borderWidth: 1,
        borderColor: '#dbe4ea',
        borderRadius: 6,
        marginBottom: 15,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
    },
    tableRow: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
    },
    tableItemCell: {
        flex: 2.35,
    },
    tableQtyCell: {
        flex: 0.55,
        textAlign: 'center',
    },
    tableRateCell: {
        flex: 1.05,
        textAlign: 'right',
    },
    tablePercentCell: {
        flex: 0.68,
        textAlign: 'right',
    },
    tableAmountCell: {
        flex: 1.15,
        textAlign: 'right',
    },
    tableCell: {
        paddingVertical: 8,
        paddingHorizontal: 6,
        borderRightWidth: 1,
        borderRightColor: '#e2e8f0',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        fontSize: 8,
        color: '#0f172a',
        lineHeight: 1.3,
    },
    tableHeaderCell: {
        paddingVertical: 8,
        paddingHorizontal: 6,
        borderRightWidth: 1,
        borderRightColor: '#e2e8f0',
        fontSize: 7,
        fontWeight: 'bold',
        color: '#475569',
        textTransform: 'uppercase',
    },
    summaryBox: {
        marginTop: 2,
        alignItems: 'flex-end',
    },
    summaryRow: {
        flexDirection: 'row',
        marginBottom: 5,
        width: 225,
        justifyContent: 'space-between',
        fontSize: 9,
        color: '#475569',
    },
    totalRow: {
        flexDirection: 'row',
        marginTop: 5,
        width: 225,
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#cbd5e1',
        paddingTop: 8,
        fontSize: 11,
        color: '#0f172a',
    },
    footer: {
        position: 'absolute',
        bottom: 19,
        left: 40,
        right: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        fontSize: 8,
        color: '#64748b',
    },
    signatureBlock: {
        marginTop: 22,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    signatureLabel: {
        fontSize: 9,
        color: '#64748b',
    },
    authorizedName: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#0f172a',
        marginTop: 6,
    },
    terms: {
        marginTop: 20,
    },
    termsText: {
        fontSize: 8,
        color: '#475569',
        lineHeight: 1.45,
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
    const subtitleText = isBilling ? ` invoice generated by ${CompanyName} ` : ` quotation generated by ${CompanyName}`;
    const customerSectionTitle = isBilling ? 'Billing Details' : 'Customer Details';

    const companyRows = [
        {label: 'Name', value: data.company?.name},
        {label: 'Address', value: data.company?.address},
        {label: 'Country', value: data.company?.country},
        {label: 'State', value: data.company?.state},
        {label: 'City', value: data.company?.city},
        {label: 'Pincode', value: data.company?.pincode},
        {label: 'GSTIN', value: data.company?.gstin},
        {label: 'Phone', value: data.company?.phone},
        {label: 'Email', value: data.company?.email},
        {label: 'Website', value: data.company?.website},
    ].filter((row) => row.value && String(row.value).trim() !== '');

    const customerRows = [
        {label: 'Customer', value: data.customer?.name},
        {label: 'Company', value: data.customer?.companyName},
        {label: 'Address', value: data.customer?.address},
        {label: 'Country', value: data.customer?.country},
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

                <View style={styles.headerRow} wrap={false}>
                    <View style={styles.brand}>
                        {logo ? <Image src={logo}
                                       style={{width: 82, height: 48, objectFit: 'contain', marginBottom: 8}}/> : null}
                        <Text style={styles.title}>{titleText}</Text>
                        <Text style={styles.subtitle}>{subtitleText}</Text>
                    </View>
                    <View style={styles.documentMeta}>
                        <Text style={{
                            fontSize: 13,
                            fontWeight: 'bold',
                            color: '#0f766e',
                            marginBottom: 6
                        }}>{documentNumber}</Text>
                        <Text style={{
                            fontSize: 8,
                            color: '#64748b',
                            marginBottom: 3
                        }}>Date: {formatAppDate(data.quotation?.quotationDate, '')}</Text>
                        {data.quotation?.validUntil ? (
                            <Text style={{fontSize: 8, color: '#64748b'}}>Valid
                                until: {formatAppDate(data.quotation.validUntil, '')}</Text>
                        ) : null}
                    </View>
                </View>

                <View style={styles.detailsRow}>
                    {companyRows.length > 0 ? (
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Company Details</Text>
                            {companyRows.map((row) => (
                                <View style={styles.row} key={row.label} wrap={false}>
                                    <Text style={styles.label}>{row.label}</Text>
                                    <Text style={styles.value}>{row.value}</Text>
                                </View>
                            ))}
                        </View>
                    ) : null}

                    {customerRows.length > 0 ? (
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>{customerSectionTitle}</Text>
                            {customerRows.map((row) => (
                                <View style={styles.row} key={row.label} wrap={false}>
                                    <Text style={styles.label}>{row.label}</Text>
                                    <Text style={styles.value}>{row.value}</Text>
                                </View>
                            ))}
                        </View>
                    ) : null}
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, styles.tableItemCell]}>Item</Text>
                        <Text style={[styles.tableHeaderCell, styles.tableQtyCell]}>Qty</Text>
                        <Text style={[styles.tableHeaderCell, styles.tableRateCell]}>Rate</Text>
                        <Text style={[styles.tableHeaderCell, styles.tablePercentCell]}>Discount</Text>
                        <Text style={[styles.tableHeaderCell, styles.tablePercentCell]}>GST</Text>
                        <Text style={[styles.tableHeaderCell, styles.tableAmountCell]}>Amount</Text>
                    </View>
                    {filteredItems.map((item) => {
                        const {amount} = calculateLineAmounts(item);
                        return (
                            <View style={styles.tableRow} key={item.id} wrap={false}>
                                <View style={[styles.tableCell, styles.tableItemCell]}>
                                    <Text>{item.itemName}</Text>
                                </View>
                                <Text style={[styles.tableCell, styles.tableQtyCell]}>{item.quantity}</Text>
                                <Text
                                    style={[styles.tableCell, styles.tableRateCell]}>{formatCurrency(Number(item.rate || 0), currencyCode)}</Text>
                                <Text
                                    style={[styles.tableCell, styles.tablePercentCell]}>{Number(item.discount || 0)}%</Text>
                                <Text
                                    style={[styles.tableCell, styles.tablePercentCell]}>{Number(item.gst || 0)}%</Text>
                                <Text
                                    style={[styles.tableCell, styles.tableAmountCell]}>{formatCurrency(amount, currencyCode)}</Text>
                            </View>
                        );
                    })}
                </View>

                <View style={styles.summaryBox} wrap={false}>
                    <View
                        style={styles.summaryRow}><Text>Subtotal</Text><Text>{formatCurrency(summary.subtotal, currencyCode)}</Text></View>
                    <View
                        style={styles.summaryRow}><Text>Discount</Text><Text>-{formatCurrency(summary.discount, currencyCode)}</Text></View>
                    <View style={styles.summaryRow}><Text>GST
                        Total</Text><Text>{formatCurrency(summary.gstTotal, currencyCode)}</Text></View>
                    <View
                        style={styles.summaryRow}><Text>Shipping</Text><Text>{formatCurrency(summary.shipping, currencyCode)}</Text></View>
                    <View style={styles.totalRow}>
                        <Text style={{fontWeight: 'bold'}}>Grand Total</Text>
                        <Text style={{
                            fontWeight: 'bold',
                            color: '#0f766e'
                        }}>{formatGrandTotal(summary.grandTotal, currencyCode)}</Text>
                    </View>
                </View>

                {data.quotation?.terms && String(data.quotation.terms).trim() !== '' ? (
                    <View style={styles.terms}>
                        <Text style={styles.sectionTitle}>Terms & Conditions</Text>
                        <Text style={styles.termsText}>{data.quotation.terms}</Text>
                    </View>
                ) : null}

                {data.signature?.preview ? (
                    <View style={styles.signatureBlock} wrap={false}>
                        <View style={{alignItems: 'flex-start'}}>
                            <Text style={styles.signatureLabel}>Authorized Signature</Text>
                            <Image src={data.signature.preview}
                                   style={{width: 120, height: 50, objectFit: 'contain', marginTop: 8}}/>
                            <Text style={styles.authorizedName}>{authorizedPerson}</Text>
                        </View>
                        <View style={{alignItems: 'flex-end'}}>
                            <Text style={styles.signatureLabel}>Generated using Gibbs</Text>
                        </View>
                    </View>
                ) : (
                    <View style={{marginTop: 22, alignItems: 'flex-start'}} wrap={false}>

                        <Text style={styles.signatureLabel}>Authorized Person</Text>

                    </View>
                )}

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
