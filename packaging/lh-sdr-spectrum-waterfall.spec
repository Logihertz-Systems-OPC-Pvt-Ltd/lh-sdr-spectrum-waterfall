Name:           lh-sdr-spectrum-waterfall
Version:        0.1.0
Release:        1%{?dist}
Summary:        lh-waterfall - Radix-2 Cooley-Tukey FFT & Ring-Buffer Texture Coordinate
License:        Apache-2.0
URL:            https://github.com/Logihertz-Systems-OPC-Pvt-Ltd/lh-sdr-spectrum-waterfall
Source0:        %{name}-%{version}-src.tar.gz
Packager:       Sameer Tawade <ops@logihertz.com>
BuildArch:      %{_arch}

%description
Zero-dependency TypeScript 60fps WebGL2 (GLSL ES 3.0) & WebGPU (WGSL) O(1) circular ring-buffer RF spectrum waterfall engine, Radix-2 Cooley-Tukey FFT processor, and SDR dashboard posture auditor.

%prep
%autosetup -n %{name}-0.1.0

%build
# Industrial clean-room build with zero external runtime dependencies

%install
rm -rf %{buildroot}
mkdir -p %{buildroot}%{_bindir}
mkdir -p %{buildroot}%{_docdir}/%{name}
mkdir -p %{buildroot}%{_mandir}/man1

if [ -f bin/lh-waterfall ]; then
    install -m 0755 bin/lh-waterfall %{buildroot}%{_bindir}/lh-waterfall
elif [ -f lh-waterfall ]; then
    install -m 0755 lh-waterfall %{buildroot}%{_bindir}/lh-waterfall
fi

install -m 0644 README.md %{buildroot}%{_docdir}/%{name}/README.md
install -m 0644 SPEC.md %{buildroot}%{_docdir}/%{name}/SPEC.md
install -m 0644 LICENSE %{buildroot}%{_docdir}/%{name}/LICENSE
install -m 0644 NOTICE %{buildroot}%{_docdir}/%{name}/NOTICE

%files
%doc %{_docdir}/%{name}/README.md
%doc %{_docdir}/%{name}/SPEC.md
%doc %{_docdir}/%{name}/NOTICE
%license %{_docdir}/%{name}/LICENSE

%changelog
* Mon Nov 16 2026 Sameer Tawade <ops@logihertz.com> - 0.1.0-1
- Initial production release for lh-sdr-spectrum-waterfall.
