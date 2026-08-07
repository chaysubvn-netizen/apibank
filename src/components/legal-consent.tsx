'use client';

import { Checkbox, Modal } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import { useState } from 'react';

type Props = {
  checked?: boolean;
  onChange?: (event: CheckboxChangeEvent) => void;
};

export function LegalConsent({ checked, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Checkbox checked={checked} onChange={onChange}>
        Bằng cách cung cấp thông tin đăng nhập. Bạn đã đồng ý với{' '}
        <button
          type="button"
          className="legal-policy-link"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen(true);
          }}
        >
          Chính Sách Bảo mật
        </button>{' '}
        và đang cho phép chúng tôi truy xuất và quản lý dữ liệu tài chính của
        mình
      </Checkbox>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={900}
        centered
        title="Các điều khoản và điều kiện & Chính sách bảo mật"
        className="legal-policy-modal"
      >
        <article className="legal-policy-content">
          <h1>VĂN BẢN PHÁP LÝ &amp; THỎA THUẬN NGƯỜI DÙNG</h1>
          <p>
            <em>Cập nhật lần cuối: ngày 30 tháng 7 năm 2026</em>
          </p>
          <p>
            Chào mừng bạn đến với hệ thống của chúng tôi. Trước khi sử dụng dịch
            vụ, vui lòng đọc kỹ các nội dung dưới đây. Việc đăng ký và sử dụng
            dịch vụ đồng nghĩa với việc bạn đã hiểu và đồng ý tuân thủ các chính
            sách này.
          </p>

          <hr />
          <h2>PHẦN A. CHÍNH SÁCH BẢO MẬT (PRIVACY POLICY)</h2>
          <p>
            Chúng tôi cam kết bảo vệ sự riêng tư và bảo mật thông tin cá nhân
            của bạn. Chính sách này mô tả cách chúng tôi thu thập, sử dụng, lưu
            trữ và bảo vệ dữ liệu.
          </p>

          <h3>1. Thu thập thông tin</h3>
          <p>Khi bạn sử dụng dịch vụ, chúng tôi có thể thu thập:</p>
          <ul>
            <li>
              <b>Thông tin định danh:</b> tên, email, số điện thoại và thông tin
              liên hệ do bạn cung cấp.
            </li>
            <li>
              <b>Thông tin kỹ thuật:</b> địa chỉ IP, loại trình duyệt, thời gian
              truy cập và nhật ký hệ thống phục vụ bảo mật và xử lý lỗi.
            </li>
            <li>
              <b>Thông tin tài khoản tài chính:</b> thông tin kết nối do bạn chủ
              động cung cấp để hệ thống truy vấn số dư và giao dịch theo yêu
              cầu.
            </li>
          </ul>

          <h3>2. Phạm vi sử dụng thông tin</h3>
          <ul>
            <li>Cung cấp, vận hành và duy trì dịch vụ API.</li>
            <li>Xác thực danh tính, hỗ trợ khách hàng và xử lý sự cố.</li>
            <li>
              Thông báo thay đổi chính sách, bảo trì hoặc cập nhật dịch vụ.
            </li>
            <li>
              Phát hiện và ngăn chặn gian lận, lạm dụng hoặc hành vi vi phạm
              pháp luật.
            </li>
          </ul>

          <h3>3. Lưu trữ và bảo vệ dữ liệu</h3>
          <p>
            Chúng tôi áp dụng các biện pháp kỹ thuật và quản trị phù hợp để hạn
            chế truy cập trái phép. Thông tin kết nối chỉ được sử dụng nhằm thực
            hiện chức năng mà người dùng yêu cầu và không được công khai cho
            người dùng khác.
          </p>

          <h3>4. Chia sẻ thông tin</h3>
          <p>
            Chúng tôi không bán dữ liệu cá nhân. Dữ liệu chỉ được chia sẻ khi có
            sự đồng ý của bạn, khi cần cung cấp dịch vụ, hoặc khi pháp luật và
            cơ quan có thẩm quyền yêu cầu.
          </p>

          <h3>5. Quyền của người dùng</h3>
          <p>
            Bạn có quyền yêu cầu xem, sửa hoặc xóa dữ liệu tài khoản; ngừng kết
            nối tài khoản tài chính; và liên hệ bộ phận hỗ trợ khi có thắc mắc
            về quyền riêng tư.
          </p>

          <hr />
          <h2>PHẦN B. ĐIỀU KHOẢN SỬ DỤNG</h2>
          <p>
            Bạn chịu trách nhiệm bảo vệ tài khoản, chỉ kết nối tài khoản thuộc
            quyền sử dụng hợp pháp của mình và không sử dụng dịch vụ cho mục
            đích gian lận hoặc trái pháp luật.
          </p>
          <p>
            Dịch vụ phụ thuộc vào hệ thống của các ngân hàng và nhà cung cấp bên
            thứ ba nên đôi lúc có thể gián đoạn, thay đổi hoặc yêu cầu đăng nhập
            lại.
          </p>
        </article>
      </Modal>
    </>
  );
}
