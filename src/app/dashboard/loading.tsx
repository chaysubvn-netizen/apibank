'use client';

import { Spin } from 'antd';

export default function DashboardLoading() {
  return (
    <div
      className="customer-page-loading"
      role="status"
      aria-label="Đang tải trang"
    >
      <Spin size="large" />
    </div>
  );
}
