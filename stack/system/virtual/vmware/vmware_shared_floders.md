---
id: vmware_shared_floders
title: 主机与 VMware 虚拟机共享文件夹
sidebar_label: VMware 共享文件夹
---

在使用 VMware 虚拟机时，在与主机之间传递文件最快捷的方法为开启共享文件夹，可以实现丝滑的拖动复制文件的方法

## VMware 端设置
虚拟机 -> 设置 -> 选项 -> 共享文件夹 -> 总是启用

![](https://pictures-1304295136.cos.ap-guangzhou.myqcloud.com/wiki/system/vmware/vmware_setting.PNG)

配置好启用以及路径之后即可
    

## 虚拟机端挂载目录

`/mnt/hgfs` 是挂载点，我们可以将设置好的文件夹挂载到此目录下

``` bash
sudo mount -t fuse.vmhgffs .host:/ /mnt/hgfs -o allow_other
```

即可在 `/mnt/hgfs` 查看到配置好的目录，最爽的是能直接在主机与虚拟机之间直接拖动复制文件

当虚拟机重启后，需要重新挂载共享文件夹，可以将挂载的命令写入 `/etc/fstab` 中，实现启动时自动挂载

```bash
echo '.host:/ /mnt/hgfs fuse.vmhgfs allow_other,uid=1000,gid=1000 0 0' | sudo -tee -a /etc/fstab 
```

这条命令会将挂载的文件夹所有者设置为默认用户，确保其对挂载的共享文件夹具有读写权限，并且虚拟机重启也会自动挂载