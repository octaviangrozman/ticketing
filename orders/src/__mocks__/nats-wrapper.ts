export const natsWrapper = {
  client: {
    publish: jest
      .fn((subject: string, data: string, callback: () => void) => {
        callback();
      })
      .mockImplementation(),
  },
};
