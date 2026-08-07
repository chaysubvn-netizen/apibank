'use client';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Input, Space, Table } from 'antd';

export default function FeaturePage({
  title,
  description,
  action = true,
}: {
  title: string;
  description: string;
  action?: boolean;
}) {
  return (
    <>
      <div className="page-title">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <Card
        extra={
          action ? (
            <Button type="primary" icon={<PlusOutlined />}>
              Thêm mới
            </Button>
          ) : null
        }
      >
        <Space style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="Tìm kiếm..."
            style={{ width: 300 }}
          />
        </Space>
        <Table
          locale={{ emptyText: <Empty description="Chưa có dữ liệu" /> }}
          dataSource={[]}
          columns={[
            { title: 'Thông tin', dataIndex: 'name' },
            { title: 'Cập nhật', dataIndex: 'updated_at' },
            { title: 'Trạng thái', dataIndex: 'status' },
            { title: 'Thao tác', dataIndex: 'actions' },
          ]}
        />
      </Card>
    </>
  );
}
