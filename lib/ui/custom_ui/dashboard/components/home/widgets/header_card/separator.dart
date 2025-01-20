import 'package:flutter/material.dart';
import '../../../../../../vendor_ui/dashboard/components/home/widgets/header_card/separator.dart';

class CustomSeparator extends StatelessWidget {
  const CustomSeparator({this.height = 1, this.color});
  final double height;
  final Color? color;
  @override
  Widget build(BuildContext context) {
    return Separator(
      color: color,
      height: height,
    );
  }
}
