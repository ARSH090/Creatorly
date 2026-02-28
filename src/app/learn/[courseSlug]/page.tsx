import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Product } from '@/lib/models/Product';
import CourseViewer from '@/components/courses/CourseViewer';

interface CoursePageProps {
    params: Promise<{ courseSlug: string }>;
}

export async function generateMetadata({ params }: CoursePageProps) {
    const { courseSlug } = await params;
    await connectToDatabase();
    const course = await Product.findOne({ slug: courseSlug, productType: 'course' });
    
    if (!course) {
        return { title: 'Course Not Found | Creatorly' };
    }

    return {
        title: `${course.title} | Creatorly`,
        description: course.description?.slice(0, 160),
    };
}

export default async function CoursePage({ params }: CoursePageProps) {
    const { courseSlug } = await params;
    await connectToDatabase();

    const course = await Product.findOne({
        slug: courseSlug,
        productType: 'course',
        status: 'active'
    }).lean();

    if (!course) {
        notFound();
    }

    return (
        <CourseViewer course={JSON.parse(JSON.stringify(course))} />
    );
}
