import { Hono } from 'hono';
import { membershipApplications, db } from '../db';
import { zValidator } from '@hono/zod-validator';
import {
  DeleteMembershipApplication,
  InsertMembershipApplication,
  UpdateMembershipApplicationStatus,
  UpdateMembershipApplication,
} from '../models/membershipApplication';
import { eq } from 'drizzle-orm';
import { jwt } from 'hono/jwt';
import { env } from 'hono/adapter';
import { StatusCodes } from 'http-status-codes';
import { HTTPException } from 'hono/http-exception';
import { sendMembershipConfirmationEmail, sendMembershipStatusEmail } from '../services/emailService';
import { logger } from '../common/logger';

export const app = new Hono().basePath('/membership-applications');

// Public endpoint - submit membership application
app.post('/', zValidator('json', InsertMembershipApplication), async (c) => {
  const req = c.req.valid('json');

  try {
    // Get client IP for signature tracking
    const clientIp = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

    const [newApplication] = await db
      .insert(membershipApplications)
      .values({
        ...req,
        signatureIp: clientIp,
      })
      .returning();

    // Send confirmation email to applicant
    try {
      await sendMembershipConfirmationEmail(
        newApplication.email,
        newApplication.firstName,
        newApplication.lastName
      );
    } catch (emailError) {
      // Log email error but don't fail the application
      logger.error('Failed to send confirmation email', { 
        err: String(emailError), 
        applicationId: newApplication.id,
        requestId: c.get?.('requestId')
      });
    }

    logger.info('Membership application submitted', { 
      applicationId: newApplication.id,
      email: newApplication.email,
      requestId: c.get?.('requestId')
    });

    return c.json(newApplication, StatusCodes.CREATED);
  } catch (error) {
    logger.error('Failed to create membership application', { 
      err: String(error),
      requestId: c.get?.('requestId')
    });
    throw new HTTPException(StatusCodes.INTERNAL_SERVER_ERROR, {
      message: 'Failed to submit membership application',
    });
  }
});

// Protected endpoints below - require JWT authentication
app.use('*', (c, next) => {
  const secret = env<{ JWT_SECRET: string }>(c).JWT_SECRET;

  if (!secret) {
    console.error('JWT secret missing in environment for protected routes');
    return c.json({ message: 'Server misconfigured' }, StatusCodes.INTERNAL_SERVER_ERROR);
  }

  const jwtMiddleware = jwt({
    secret,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: { algorithms: ['HS256'] } as any,
  });

  return jwtMiddleware(c, next);
});

// Get all membership applications (admin only)
app.get('/', async (c) => {
  try {
    const applications = await db.query.membershipApplications.findMany({
      orderBy: (membershipApplications, { desc }) => [desc(membershipApplications.createdAt)],
    });

    return c.json(applications);
  } catch (error) {
    logger.error('Failed to fetch membership applications', { 
      err: String(error),
      requestId: c.get?.('requestId')
    });
    throw new HTTPException(StatusCodes.INTERNAL_SERVER_ERROR, {
      message: 'Failed to fetch membership applications',
    });
  }
});

// Update membership application (admin only)
app.put('/', zValidator('json', UpdateMembershipApplication), async (c) => {
  const req = c.req.valid('json');

  try {
    const [updatedApplication] = await db
      .update(membershipApplications)
      .set({
        ...req,
        updatedAt: new Date(),
      })
      .where(eq(membershipApplications.id, req.id))
      .returning();

    if (!updatedApplication) {
      throw new HTTPException(StatusCodes.NOT_FOUND, {
        message: 'Membership application not found',
      });
    }

    logger.info('Membership application updated', { 
      applicationId: updatedApplication.id,
      requestId: c.get?.('requestId')
    });

    return c.json(updatedApplication);
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    
    logger.error('Failed to update membership application', { 
      err: String(error),
      requestId: c.get?.('requestId')
    });
    throw new HTTPException(StatusCodes.INTERNAL_SERVER_ERROR, {
      message: 'Failed to update membership application',
    });
  }
});

// Delete membership application (admin only)
app.delete('/', zValidator('json', DeleteMembershipApplication), async (c) => {
  const req = c.req.valid('json');

  try {
    const [deletedApplication] = await db
      .delete(membershipApplications)
      .where(eq(membershipApplications.id, req.id))
      .returning({ id: membershipApplications.id });

    if (!deletedApplication) {
      throw new HTTPException(StatusCodes.NOT_FOUND, {
        message: 'Membership application not found',
      });
    }

    logger.info('Membership application deleted', { 
      applicationId: deletedApplication.id,
      requestId: c.get?.('requestId')
    });

    return c.json(deletedApplication);
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    
    logger.error('Failed to delete membership application', { 
      err: String(error),
      requestId: c.get?.('requestId')
    });
    throw new HTTPException(StatusCodes.INTERNAL_SERVER_ERROR, {
      message: 'Failed to delete membership application',
    });
  }
});

// Update membership application status (admin only)
app.post('/status', zValidator('json', UpdateMembershipApplicationStatus), async (c) => {
  const req = c.req.valid('json');

  try {
    // Get the application details first
    const application = await db.query.membershipApplications.findFirst({
      where: eq(membershipApplications.id, req.id),
    });

    if (!application) {
      throw new HTTPException(StatusCodes.NOT_FOUND, {
        message: 'Membership application not found',
      });
    }

    // Update the status
    const [updatedApplication] = await db
      .update(membershipApplications)
      .set({
        status: req.status,
        notes: req.notes,
        updatedAt: new Date(),
      })
      .where(eq(membershipApplications.id, req.id))
      .returning({ id: membershipApplications.id, status: membershipApplications.status });

    // Send status update email to applicant
    if (req.status === 'approved' || req.status === 'rejected') {
      try {
        await sendMembershipStatusEmail(
          application.email,
          application.firstName,
          application.lastName,
          req.status
        );
      } catch (emailError) {
        // Log email error but don't fail the status update
        logger.error('Failed to send status update email', { 
          err: String(emailError),
          applicationId: updatedApplication.id,
          requestId: c.get?.('requestId')
        });
      }
    }

    logger.info('Membership application status updated', { 
      applicationId: updatedApplication.id,
      status: updatedApplication.status,
      requestId: c.get?.('requestId')
    });

    return c.json(updatedApplication);
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    
    logger.error('Failed to update membership application status', { 
      err: String(error),
      requestId: c.get?.('requestId')
    });
    throw new HTTPException(StatusCodes.INTERNAL_SERVER_ERROR, {
      message: 'Failed to update membership application status',
    });
  }
});
