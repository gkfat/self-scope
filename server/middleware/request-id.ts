/**
 * Attach a request id to every request for log correlation.
 */
export default defineEventHandler((event) => {
    const requestId = crypto.randomUUID();

    event.context.requestId = requestId;
    event.node.res.setHeader('x-request-id', requestId);
});
