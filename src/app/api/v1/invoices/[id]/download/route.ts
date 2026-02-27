import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Invoice from '@/lib/models/Invoice';
import { getMongoUser } from '@/lib/auth/get-user';
import { generateInvoicePDF } from '@/lib/utils/pdf';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const invoice = await Invoice.findById(params.id);
        if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

        // Security: Only the buyer or the creator can download
        if (invoice.userId.toString() !== user._id.toString() && invoice.creatorId?.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const pdfBuffer = await generateInvoicePDF(invoice);

        return new NextResponse(Buffer.from(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`
            }
        });

    } catch (error: any) {
        console.error('Invoice Download Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
