import { jest } from '@jest/globals';

export const createChannelQuery = (data: any[] | null = []) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockResolvedValue({ data }),
});

export const createTrendQuery = (data: any[] | null = []) => {
  const builder: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data }),
  };

  builder.gte.mockReturnValue(builder);
  return builder;
};

export const createFollowUpSelectQuery = (followUp: any) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({
    data: followUp,
    error: null,
  }),
});

export const createFollowUpUpdateQuery = () => ({
  update: jest.fn(() => ({
    eq: jest.fn().mockResolvedValue({ error: null }),
  })),
});

export const createPeriodCountQuery = (count: number | null) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnValue({
    gte: jest.fn().mockResolvedValue({ count }),
  }),
});

export const createPendingCountQuery = (count: number | null) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockResolvedValue({ count }),
});
